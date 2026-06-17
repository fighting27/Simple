const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');

// 健康检查
router.get('/health', async (req, res, next) => {
  try {
    const result = await AIService.health();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 综合分析报告
router.get('/summary', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const result = await AIService.summary(
      year ? parseInt(year) : null,
      month ? parseInt(month) : null
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// LLM 深度分析
router.get('/llm-summary', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const result = await AIService.llmSummary(
      year ? parseInt(year) : null,
      month ? parseInt(month) : null,
      req.user?.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// LLM 账目问答
router.post('/chat', async (req, res, next) => {
  try {
    const { question, year, month } = req.body || {};
    const result = await AIService.chat(
      question,
      year ? parseInt(year) : null,
      month ? parseInt(month) : null,
      req.user?.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 月度环比对比
router.get('/comparison', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const result = await AIService.comparison(
      year ? parseInt(year) : null,
      month ? parseInt(month) : null
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 异常消费检测
router.get('/anomalies', async (req, res, next) => {
  try {
    const { year, month, threshold } = req.query;
    const result = await AIService.anomalies(
      year ? parseInt(year) : null,
      month ? parseInt(month) : null,
      threshold ? parseFloat(threshold) : null
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 月末支出预测
router.get('/prediction', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const result = await AIService.prediction(
      year ? parseInt(year) : null,
      month ? parseInt(month) : null
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 分类深度洞察
router.get('/insights', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const result = await AIService.insights(
      year ? parseInt(year) : null,
      month ? parseInt(month) : null
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// LLM 配置 - 获取状态
router.get('/config', async (req, res, next) => {
  try {
    const result = await AIService.getConfig(req.user?.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// LLM 配置 - 更新
router.post('/config', async (req, res, next) => {
  try {
    const result = await AIService.updateConfig(req.body, req.user?.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 测试 LLM 连接
router.post('/test-connection', async (req, res, next) => {
  try {
    const result = await AIService.testConnection(req.user?.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
