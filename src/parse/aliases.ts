/**
 * Products named in prose and the packages or files that prove a repository uses them.
 * Package entries ending in `/` or `*` match by prefix (`@aws-sdk/` matches `@aws-sdk/client-s3`).
 */
export interface DependencyAlias {
  name: string;
  pattern: RegExp;
  npm?: string[];
  pypi?: string[];
  go?: string[];
  cargo?: string[];
  gem?: string[];
  composer?: string[];
  maven?: string[];
  nuget?: string[];
  /** Repository files whose presence proves use (a Dockerfile proves Docker). */
  files?: RegExp[];
  /** Files whose text proves use, when the file name alone does not. */
  content?: { files: RegExp; pattern: RegExp };
}

const a = (name: string, pattern: RegExp, rest: Omit<DependencyAlias, 'name' | 'pattern'>): DependencyAlias => ({ name, pattern, ...rest });

export const DEPENDENCY_ALIASES: DependencyAlias[] = [
  // Payments, messaging, email
  a('Stripe', /\bStripe\b/, { npm: ['stripe', '@stripe/'], pypi: ['stripe'], go: ['github.com/stripe/stripe-go'], gem: ['stripe'], composer: ['stripe/stripe-php'] }),
  a('Twilio', /\bTwilio\b/, { npm: ['twilio'], pypi: ['twilio'], go: ['github.com/twilio/twilio-go'], gem: ['twilio-ruby'], composer: ['twilio/sdk'] }),
  a('SendGrid', /\bSendGrid\b/, { npm: ['@sendgrid/'], pypi: ['sendgrid'], gem: ['sendgrid-ruby'] }),
  a('Mailgun', /\bMailgun\b/, { npm: ['mailgun.js', 'mailgun-js'], pypi: ['mailgun'] }),
  a('Resend', /\bResend\b/, { npm: ['resend'], pypi: ['resend'] }),
  a('MJML', /\bMJML\b/, { npm: ['mjml'] }),
  a('Slack', /\bSlack\b/, { npm: ['@slack/'], pypi: ['slack-sdk', 'slack_sdk', 'slack-bolt'], go: ['github.com/slack-go/slack'] }),
  a('Notion', /\bNotion\b/, { npm: ['@notionhq/client'], pypi: ['notion-client'] }),
  // AI
  a('OpenAI', /\bOpenAI\b/, { npm: ['openai', '@ai-sdk/openai'], pypi: ['openai'], go: ['github.com/openai/openai-go', 'github.com/sashabaranov/go-openai'] }),
  a('Anthropic', /\bAnthropic\b/, { npm: ['@anthropic-ai/'], pypi: ['anthropic'], go: ['github.com/anthropics/anthropic-sdk-go'] }),
  a('LangChain', /\bLangChain\b/, { npm: ['langchain', '@langchain/'], pypi: ['langchain'] }),
  // Auth
  a('Cognito', /\bCognito\b/, { npm: ['amazon-cognito-identity-js', '@aws-sdk/client-cognito-identity-provider', 'aws-amplify'], pypi: ['boto3'] }),
  a('Auth0', /\bAuth0\b/, { npm: ['@auth0/', 'auth0'], pypi: ['auth0-python'] }),
  a('Clerk', /\bClerk\b/, { npm: ['@clerk/'] }),
  a('NextAuth', /\bNextAuth\b|\bAuth\.js\b/, { npm: ['next-auth', '@auth/'] }),
  a('Passport', /\bPassport(?:\.js)?\b/, { npm: ['passport'] }),
  // Observability and product analytics
  a('Sentry', /\bSentry\b/, { npm: ['@sentry/'], pypi: ['sentry-sdk'], go: ['github.com/getsentry/sentry-go'], gem: ['sentry-ruby'] }),
  a('Datadog', /\bDatadog\b/, { npm: ['dd-trace', '@datadog/'], pypi: ['ddtrace', 'datadog'], go: ['gopkg.in/DataDog/', 'github.com/DataDog/'] }),
  a('PostHog', /\bPostHog\b/, { npm: ['posthog-js', 'posthog-node'], pypi: ['posthog'] }),
  a('OpenTelemetry', /\bOpenTelemetry\b/, { npm: ['@opentelemetry/'], pypi: ['opentelemetry-'], go: ['go.opentelemetry.io/'] }),
  a('Segment', /\bSegment\b(?= (?:analytics|events|tracking))/, { npm: ['@segment/', 'analytics-node'] }),
  a('Mixpanel', /\bMixpanel\b/, { npm: ['mixpanel', 'mixpanel-browser'], pypi: ['mixpanel'] }),
  a('LaunchDarkly', /\bLaunchDarkly\b/, { npm: ['launchdarkly-', '@launchdarkly/'], pypi: ['launchdarkly-server-sdk'] }),
  a('GrowthBook', /\bGrowthBook\b/, { npm: ['@growthbook/'], pypi: ['growthbook'] }),
  // Data stores and queues
  a('PostgreSQL', /\bPostgreSQL\b|\bPostgres\b/, { npm: ['pg', 'postgres', '@neondatabase/serverless'], pypi: ['psycopg', 'psycopg2', 'psycopg2-binary', 'asyncpg'], go: ['github.com/lib/pq', 'github.com/jackc/pgx'], gem: ['pg'], files: [/(^|\/)(docker-)?compose[\w.-]*\.ya?ml$/] }),
  a('MySQL', /\bMySQL\b/, { npm: ['mysql', 'mysql2'], pypi: ['mysqlclient', 'pymysql'], go: ['github.com/go-sql-driver/mysql'], gem: ['mysql2'] }),
  a('SQLite', /\bSQLite\b/, { npm: ['sqlite3', 'better-sqlite3', 'sqlite'], go: ['github.com/mattn/go-sqlite3', 'modernc.org/sqlite'], gem: ['sqlite3'] }),
  a('MongoDB', /\bMongoDB\b|\bMongo\b/, { npm: ['mongodb', 'mongoose'], pypi: ['pymongo', 'motor'], go: ['go.mongodb.org/mongo-driver'], gem: ['mongoid', 'mongo'] }),
  a('Redis', /\bRedis\b/, { npm: ['redis', 'ioredis', '@redis/'], pypi: ['redis'], go: ['github.com/redis/go-redis', 'github.com/go-redis/redis'], gem: ['redis'] }),
  a('BullMQ', /\bBullMQ\b/, { npm: ['bullmq'] }),
  a('Kafka', /\bKafka\b/, { npm: ['kafkajs', '@confluentinc/'], pypi: ['kafka-python', 'confluent-kafka'], go: ['github.com/segmentio/kafka-go', 'github.com/IBM/sarama', 'github.com/confluentinc/'] }),
  a('RabbitMQ', /\bRabbitMQ\b/, { npm: ['amqplib'], pypi: ['pika', 'aio-pika'], go: ['github.com/rabbitmq/amqp091-go'] }),
  a('Elasticsearch', /\bElasticsearch\b/, { npm: ['@elastic/elasticsearch'], pypi: ['elasticsearch'] }),
  a('OpenSearch', /\bOpenSearch\b/, { npm: ['@opensearch-project/opensearch'], pypi: ['opensearch-py'] }),
  a('Supabase', /\bSupabase\b/, { npm: ['@supabase/'], pypi: ['supabase'] }),
  a('Firebase', /\bFirebase\b/, { npm: ['firebase', 'firebase-admin'], pypi: ['firebase-admin'] }),
  // ORMs and query builders
  a('Prisma', /\bPrisma\b/, { npm: ['prisma', '@prisma/client'] }),
  a('Drizzle', /\bDrizzle\b/, { npm: ['drizzle-orm'] }),
  a('Knex', /\bKnex\b/, { npm: ['knex'] }),
  a('Sequelize', /\bSequelize\b/, { npm: ['sequelize'] }),
  a('TypeORM', /\bTypeORM\b/, { npm: ['typeorm'] }),
  a('Mongoose', /\bMongoose\b/, { npm: ['mongoose'] }),
  a('SQLAlchemy', /\bSQLAlchemy\b/, { pypi: ['sqlalchemy'] }),
  a('Alembic', /\bAlembic\b/, { pypi: ['alembic'] }),
  a('GORM', /\bGORM\b/, { go: ['gorm.io/gorm'] }),
  // Web frameworks
  a('Express', /\bExpress(?:\.js)?\b/, { npm: ['express'] }),
  a('Fastify', /\bFastify\b/, { npm: ['fastify'] }),
  a('NestJS', /\bNestJS\b|\bNest\.js\b/, { npm: ['@nestjs/'] }),
  a('Hono', /\bHono\b/, { npm: ['hono'] }),
  a('Koa', /\bKoa\b/, { npm: ['koa'] }),
  a('Next.js', /\bNext\.js\b/, { npm: ['next'] }),
  a('React', /\bReact\b(?! Native)/, { npm: ['react'] }),
  a('React Native', /\bReact Native\b/, { npm: ['react-native'] }),
  a('Vue', /\bVue(?:\.js)?\b/, { npm: ['vue'] }),
  a('Nuxt', /\bNuxt\b/, { npm: ['nuxt'] }),
  a('Svelte', /\bSvelte(?:Kit)?\b/, { npm: ['svelte', '@sveltejs/kit'] }),
  a('Angular', /\bAngular\b/, { npm: ['@angular/core'] }),
  a('Astro', /\bAstro\b/, { npm: ['astro'] }),
  a('Remix', /\bRemix\b/, { npm: ['@remix-run/'] }),
  a('Django', /\bDjango\b/, { pypi: ['django'] }),
  a('Flask', /\bFlask\b/, { pypi: ['flask'] }),
  a('FastAPI', /\bFastAPI\b/, { pypi: ['fastapi'] }),
  a('Celery', /\bCelery\b/, { pypi: ['celery'] }),
  a('Pydantic', /\bPydantic\b/, { pypi: ['pydantic'] }),
  a('Rails', /\bRails\b/, { gem: ['rails', 'railties'] }),
  a('Sidekiq', /\bSidekiq\b/, { gem: ['sidekiq'] }),
  a('Laravel', /\bLaravel\b/, { composer: ['laravel/framework'] }),
  a('Gin', /\bGin\b(?= (?:framework|router|server|handlers?))/, { go: ['github.com/gin-gonic/gin'] }),
  a('Cobra', /\bCobra\b/, { go: ['github.com/spf13/cobra'] }),
  a('Tokio', /\bTokio\b/, { cargo: ['tokio'] }),
  a('Axum', /\bAxum\b/, { cargo: ['axum'] }),
  a('Serde', /\bSerde\b/, { cargo: ['serde'] }),
  a('Spring Boot', /\bSpring Boot\b/, { maven: ['org.springframework.boot'] }),
  // Frontend state, styling, UI
  a('Redux', /\bRedux\b/, { npm: ['redux', '@reduxjs/toolkit', 'react-redux'] }),
  a('Recoil', /\bRecoil\b/, { npm: ['recoil'] }),
  a('Jotai', /\bJotai\b/, { npm: ['jotai'] }),
  a('Zustand', /\bZustand\b/, { npm: ['zustand'] }),
  a('MobX', /\bMobX\b/, { npm: ['mobx'] }),
  a('TanStack Query', /\bTanStack Query\b|\bReact Query\b/, { npm: ['@tanstack/react-query', 'react-query'] }),
  a('MUI', /\bMUI\b|\bMaterial UI\b/, { npm: ['@mui/material', '@material-ui/core'] }),
  a('Emotion', /\bEmotion\b/, { npm: ['@emotion/'] }),
  a('Tailwind', /\bTailwind(?:CSS)?\b/, { npm: ['tailwindcss'] }),
  a('Chakra UI', /\bChakra(?: UI)?\b/, { npm: ['@chakra-ui/'] }),
  a('shadcn/ui', /\bshadcn\b/, { npm: ['@radix-ui/'], files: [/(^|\/)components\.json$/] }),
  a('Storybook', /\bStorybook\b/, { npm: ['storybook', '@storybook/'] }),
  // Validation and APIs
  a('Zod', /\bZod\b/, { npm: ['zod'] }),
  a('tRPC', /\btRPC\b/, { npm: ['@trpc/'] }),
  a('GraphQL', /\bGraphQL\b/, { npm: ['graphql', '@apollo/', 'graphql-yoga'], pypi: ['graphene', 'strawberry-graphql'], go: ['github.com/99designs/gqlgen'], files: [/\.(graphql|gql)$/] }),
  a('Apollo', /\bApollo\b/, { npm: ['@apollo/'] }),
  a('Socket.IO', /\bSocket\.IO\b/i, { npm: ['socket.io', 'socket.io-client'] }),
  // Tooling
  a('Jest', /\bJest\b/, { npm: ['jest'] }),
  a('Vitest', /\bVitest\b/, { npm: ['vitest'] }),
  a('Mocha', /\bMocha\b/, { npm: ['mocha'] }),
  a('Cypress', /\bCypress\b/, { npm: ['cypress'] }),
  a('Playwright', /\bPlaywright\b/, { npm: ['@playwright/test', 'playwright', 'playwright-core'], pypi: ['playwright'] }),
  a('Puppeteer', /\bPuppeteer\b/, { npm: ['puppeteer', 'puppeteer-core'] }),
  a('ESLint', /\bESLint\b/, { npm: ['eslint'] }),
  a('Prettier', /\bPrettier\b/, { npm: ['prettier'] }),
  a('Biome', /\bBiome\b/, { npm: ['@biomejs/biome'] }),
  a('Husky', /\bHusky\b/, { npm: ['husky'] }),
  a('Webpack', /\bWebpack\b/, { npm: ['webpack'] }),
  a('Vite', /\bVite\b/, { npm: ['vite'] }),
  a('esbuild', /\besbuild\b/, { npm: ['esbuild'] }),
  a('Turborepo', /\bTurborepo\b/, { npm: ['turbo'] }),
  a('Nx', /\bNx\b(?= (?:workspace|monorepo))/, { npm: ['nx'] }),
  a('pytest', /\bpytest\b/, { pypi: ['pytest'] }),
  a('Ruff', /\bRuff\b/, { pypi: ['ruff'] }),
  // Infrastructure
  a('Docker', /\bDocker\b/, { files: [/(^|\/)Dockerfile(\.[\w.-]+)?$/, /(^|\/)(docker-)?compose[\w.-]*\.ya?ml$/] }),
  a('Kubernetes', /\bKubernetes\b|\bk8s\b/, { files: [/(^|\/)Chart\.yaml$/, /(^|\/)(k8s|kubernetes|manifests|helm|charts)\//, /(^|\/)kustomization\.ya?ml$/], content: { files: /\.ya?ml$/, pattern: /^apiVersion:\s*\S+[\s\S]*?^kind:\s*\w+/m } }),
  a('Helm', /\bHelm\b/, { files: [/(^|\/)Chart\.yaml$/] }),
  a('Terraform', /\bTerraform\b/, { files: [/\.tf$/] }),
  a('Pulumi', /\bPulumi\b/, { npm: ['@pulumi/'], pypi: ['pulumi'], files: [/(^|\/)Pulumi\.ya?ml$/] }),
  a('GitHub Actions', /\bGitHub Actions\b/, { files: [/^\.github\/workflows\/[^/]+\.ya?ml$/] }),
  a('AWS', /\bAWS\b/, { npm: ['aws-sdk', '@aws-sdk/', 'aws-cdk-lib', 'sst'], pypi: ['boto3', 'aws-cdk-lib'], go: ['github.com/aws/aws-sdk-go'], files: [/\.tf$/, /(^|\/)serverless\.ya?ml$/, /(^|\/)cdk\.json$/] }),
];
