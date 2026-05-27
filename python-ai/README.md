# 🧠 Money-Sys AI 智能分析服务

为 money-sys 记账系统提供 AI 驱动的智能分析能力。

## 功能

| 接口 | 说明 |
|------|------|
| `GET /api/ai/summary` | 综合分析报告（自然语言摘要） |
| `GET /api/ai/comparison` | 月度环比对比（本月 vs 上月） |
| `GET /api/ai/anomalies` | 异常消费检测（Z-score） |
| `GET /api/ai/prediction` | 月末支出预测（加权移动平均） |
| `GET /api/ai/insights` | 分类深度洞察 + 建议 |
| `GET /api/ai/health` | 健康检查 |

所有接口支持 `?year=2026&month=5` 参数指定月份。

## 快速开始

```bash
cd python-ai

# 创建虚拟环境 + 安装依赖（首次）
uv venv
.venv\Scripts\activate
uv pip install -r requirements.txt

# 启动服务
.venv\Scripts\python app.py
# 或双击 start.bat
```

服务运行在 `http://localhost:5001`

## 依赖

- Flask — Web 框架
- NumPy — 数值计算
- SciPy — 统计分析

## 架构

```
python-ai/
├── app.py           # Flask API 入口
├── analyzer.py      # AI 分析核心引擎
├── db_reader.py     # SQLite 数据读取层
├── requirements.txt # Python 依赖
├── start.bat        # Windows 启动脚本
└── .venv/           # 虚拟环境
```

## 分析算法

1. **环比对比** — 各分类本月 vs 上月金额和占比变化
2. **异常检测** — 基于过去6个月日均值的 Z-score（默认阈值 2.0σ）
3. **月末预测** — 加权移动平均，越到月末权重越高
4. **分类洞察** — 占比变化 + 单笔均值 + 智能建议
