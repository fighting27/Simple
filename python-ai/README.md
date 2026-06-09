# 🧠 Money-Sys AI 智能分析服务

为 money-sys 记账系统提供 AI 驱动的智能分析能力。

## 功能

| 接口 | 说明 |
|------|------|
| `GET /api/ai/summary` | 综合分析报告（自然语言摘要） |
| `GET /api/ai/llm-summary` | LLM 深度分析报告（调用大模型） |
| `GET /api/ai/comparison` | 月度环比对比（本月 vs 上月） |
| `GET /api/ai/anomalies` | 异常消费检测（Z-score） |
| `GET /api/ai/prediction` | 月末支出预测（加权移动平均） |
| `GET /api/ai/insights` | 分类深度洞察 + 建议 |
| `GET /api/ai/health` | 健康检查 |
| `GET/POST /api/ai/config` | LLM 配置管理 |
| `POST /api/ai/test-connection` | 测试 LLM 连接 |

所有接口支持 `?year=2026&month=5` 参数指定月份。

## 技术栈

- **Python 3.12**
- **Flask** — Web 框架
- **NumPy** — 数值计算
- **SciPy** — 统计分析
- **SQLite** — 直接读取 Node.js 后端的数据库

## 快速开始

```bash
cd python-ai

# 创建虚拟环境 + 安装依赖（首次）
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# 启动服务
python app.py
```

服务运行在 `http://localhost:5001`

## 架构

```
python-ai/
├── app.py                # Flask API 入口
├── analyzer.py           # AI 分析核心引擎
├── db_reader.py          # SQLite 数据读取层
├── llm_client.py         # LLM API 客户端
├── ai_config_manager.py  # LLM 配置管理
├── requirements.txt      # Python 依赖
└── .venv/                # 虚拟环境
```

## 分析算法

1. **环比对比** — 各分类本月 vs 上月金额和占比变化
2. **异常检测** — 基于过去6个月日均值的 Z-score（默认阈值 2.0σ）
3. **月末预测** — 加权移动平均，越到月末权重越高
4. **分类洞察** — 占比变化 + 单笔均值 + 智能建议
5. **LLM 分析** — 调用大模型生成深度财务分析报告

## LLM 配置

支持 DeepSeek、OpenAI、小米 MiMo 等大模型。

创建 `.env.local` 文件配置：
```env
AI_API_KEY=your_api_key
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
AI_ENABLED=true
```

或通过 API `/api/ai/config` 动态配置。
