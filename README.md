![CircleCI](https://img.shields.io/circleci/build/github/Kombustor/rss-fulltext-proxy.svg)
![License](https://img.shields.io/github/license/Kombustor/rss-fulltext-proxy.svg)
![Docker Pulls](https://img.shields.io/docker/pulls/kombustor/rss-fulltext-proxy.svg)
[![Greenkeeper badge](https://badges.greenkeeper.io/Kombustor/rss-fulltext-proxy.svg)](https://greenkeeper.io/)

# RSS Fulltext Proxy 📃

Can "proxy"/mirror any RSS Feed to fetch full-text Content.
Allows integration into any feed reader, without plugins or further configuration required.

## Deployment

### Using Docker (recommended)

1. Download and modify the docker-compose.yml file to your liking.
2. Run `docker-compose up -d`

### Manually

1. Clone the repository: `git clone https://github.com/Kombustor/rss-fulltext-proxy.git`
2. Change working path: `cd rss-fulltext-proxy`
3. Install dependencies: `npm install`
4. Compile: `npm run build`
5. Run: `node dist/server.js`

> Note: You have to set the environment variables described in [Configuration](#Configuration) yourself, and you have to start a local redis server.

## Configuration

The application is easily configurable with environment variables.

| Name                 | Type   | Default           | Description                                        |
|----------------------|--------|-------------------|----------------------------------------------------|
| PORT                 | number | 3000              | The port the webserver listens on.                 |
| REDIS_URL            | string | redis://127.0.0.1 | The redis connection URL for caching.              |
| CACHE_EXPIRY_SECONDS | number | 900               | The number of seconds for cache entries to expire. |

## Usage

Simply prepend the proxy server to any feed URL, like:

```
http://localhost:3000/https://hnrss.org/newest?points=100
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

### TODO

- Make redis optional.
- Add common templates for easier usage.
- Unit tests.
- Linting.
- Add option to clear cache.
- Tutorial on how to choose selectors.
- Webinterface to visually select elements that should be included/removed.
- Support websites which don't provide a RSS feed.

## License

[MIT](https://choosealicense.com/licenses/mit/)
