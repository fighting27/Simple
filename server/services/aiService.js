/**
 * AI 智能分析服务代理
 * 转发请求到 Python Flask 服务 (localhost:5001)
 */
const http = require('http');

const AI_SERVICE_URL = 'http://localhost:5001';

class AIService {
  /**
   * 向 Python AI 服务发起 GET 请求
   */
  static async get(path, params = {}) {
    return new Promise((resolve, reject) => {
      const queryString = new URLSearchParams(params).toString();
      const url = `${AI_SERVICE_URL}${path}${queryString ? '?' + queryString : ''}`;

      const req = http.get(url, { timeout: 30000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(new Error('AI 服务返回无效数据'));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`AI 服务连接失败: ${err.message}。请确认 Python 服务已启动 (python app.py)`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('AI 服务响应超时'));
      });
    });
  }

  /**
   * 向 Python AI 服务发起 POST 请求
   */
  static async post(path, body = {}) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const url = new URL(`${AI_SERVICE_URL}${path}`);

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 30000,
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(responseData);
            resolve(json);
          } catch (e) {
            reject(new Error('AI 服务返回无效数据'));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`AI 服务连接失败: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('AI 服务响应超时'));
      });

      req.write(data);
      req.end();
    });
  }

  /** 健康检查 */
  static async health() {
    return this.get('/api/ai/health');
  }

  /** 综合分析报告 */
  static async summary(year, month) {
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    return this.get('/api/ai/summary', params);
  }

  /** LLM 深度分析 */
  static async llmSummary(year, month) {
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    return this.get('/api/ai/llm-summary', params);
  }

  /** 月度环比对比 */
  static async comparison(year, month) {
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    return this.get('/api/ai/comparison', params);
  }

  /** 异常消费检测 */
  static async anomalies(year, month, threshold) {
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    if (threshold) params.threshold = threshold;
    return this.get('/api/ai/anomalies', params);
  }

  /** 月末支出预测 */
  static async prediction(year, month) {
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    return this.get('/api/ai/prediction', params);
  }

  /** 分类深度洞察 */
  static async insights(year, month) {
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    return this.get('/api/ai/insights', params);
  }

  /** 获取 LLM 配置状态 */
  static async getConfig() {
    return this.get('/api/ai/config');
  }

  /** 更新 LLM 配置 */
  static async updateConfig(data) {
    return this.post('/api/ai/config', data);
  }

  /** 测试 LLM 连接 */
  static async testConnection() {
    return this.post('/api/ai/test-connection');
  }
}

module.exports = AIService;
