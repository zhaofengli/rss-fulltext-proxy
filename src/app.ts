import express from "express";
import Mercury from "@postlight/mercury-parser";
import RSS from "rss";
import Parser from "rss-parser";
import redis from "redis";
import sanitizeHtml from "sanitize-html";
import { URL } from 'url';
import { ItemOptions } from './types/item-options';
const {promisify} = require('util');

// Config with defaults
const config = {
    REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1',
    CACHE_EXPIRY_SECONDS: process.env.CACHE_EXPIRY_SECONDS || 60 * 15
}


const app = express();
const redisClient = redis.createClient(config.REDIS_URL)
const redisGetAsync = promisify(redisClient.get).bind(redisClient);
const redisSetAsync = promisify(redisClient.set).bind(redisClient);

// Express configuration
app.set("port", process.env.PORT || 3000);

// Proxy
app.use(async (req, res) => {
    const feed = req.url.substring(1);

    try {
        // Get the original feed
        let originalFeed;
        try {
            originalFeed = await new Parser({
                customFields: {
                    feed: ["image", "managingEditor", "copyright", "language"]
                }
            }).parseURL(feed);
        } catch (err) {
            return res.status(400).send('Error: Cannot parse feed.');
        }

        // Create the new feed from the original one
        const newFeed = new RSS(transformFeed(originalFeed))

        // Transform and add all items to the feed
        const transformedItems = await transformItems(originalFeed.items);
        transformedItems.forEach((item) => {
            newFeed.item(item);
        })

        // Send the feed as response
        res.set('Content-Type', 'text/xml');
        res.send(newFeed.xml())
    } catch (err) {
        return res.status(500).send('Error: Internal Server Error: ' + err)
    }
})

function transformFeed(originalFeed: Parser.Output) {
    return {
        title: originalFeed.title,
        description: originalFeed.description,
        feed_url: originalFeed.feedUrl,
        site_url: originalFeed.link,
        image_url: originalFeed.image ? originalFeed.image.url : undefined,
        managingEditor: originalFeed.managingEditor,
        copyright: originalFeed.copyright,
        language: originalFeed.language
    }
}

async function transformItems(input: Parser.Output["items"]): Promise<ItemOptions[]> {
    return Promise.all(input.map(async (inputItem) => await transformItem(inputItem)));
}

async function transformItem(inputItem: Parser.Item): Promise<ItemOptions> {
    // Selecting identifier
    const identifier = inputItem.guid || inputItem.link || inputItem.title;

    // Return cached element if available
    const cached = await redisGetAsync(identifier);
    if(cached) {
        return JSON.parse(cached);
    }

    let fullText = inputItem.content;
    try {
        fullText = await parseContent(inputItem.link);
    } catch (e) {
        // TODO: Better error handling
    }

    const result = {
        title: inputItem.title,
        description: fullText,
        url: inputItem.link,
        guid: inputItem.guid,
        categories: inputItem.categories,
        author: inputItem.creator,
        date: inputItem.pubDate
    }

    // Cache result
    await redisSetAsync(identifier, JSON.stringify(result), 'EX', config.CACHE_EXPIRY_SECONDS);

    return result;
}

function getLinkTransformer(baseUrl: string): sanitizeHtml.Transformer {
    return (tagName, attribs) => {
        for (const attrib of ['href', 'src']) {
            if (attribs[attrib]) {
                const url = new URL(attribs[attrib], baseUrl);
                attribs[attrib] = url.href;
            }
        }

        return {
            tagName,
            attribs,
        };
    };
}

async function parseContent(url: string): Promise<string> {
    const parsed = await Mercury.parse(url);
    const transformer = getLinkTransformer(url);

    let sanitized = sanitizeHtml(parsed.content, {
        allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'abbr', 'code', 'hr', 'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img'],
        allowedClasses: {},
        transformTags: {
            img: transformer,
            a: transformer,
        },
    });

    return sanitized;
}

export default app;
