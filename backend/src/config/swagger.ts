// OpenAPI / Swagger 配置
import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'EarnGap API',
    version: '1.0.0',
    description: 'EarnGap - Global AI Opportunity Intelligence Platform',
  },
  servers: [
    { url: 'http://localhost:4000', description: 'Development' },
    { url: 'https://api.earngap.com', description: 'Production' },
  ],
  tags: [
    { name: 'Opportunities', description: '机会管理' },
    { name: 'Stats', description: '数据统计' },
    { name: 'Alerts', description: '提醒管理' },
    { name: 'Scan', description: '扫描管理' },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
