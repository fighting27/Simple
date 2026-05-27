"""
AI 智能分析 API 服务
Flask 应用，为 money-sys Node.js 后端提供分析接口
"""
from flask import Flask, jsonify, request
from flask_cors import CORS

from analyzer import (
    month_comparison,
    detect_anomalies,
    predict_month_end,
    category_insights,
    generate_summary,
    llm_analysis,
)
from ai_config_manager import load_config, save_config, get_config_status

app = Flask(__name__)
CORS(app)


@app.route('/api/ai/health', methods=['GET'])
def health():
    """健康检查"""
    config = load_config()
    return jsonify({
        'status': 'ok',
        'service': 'money-sys-ai',
        'llm_enabled': config.get('enabled', False) and bool(config.get('api_key')),
    })


@app.route('/api/ai/summary', methods=['GET'])
def summary():
    """综合分析报告（规则引擎）"""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    try:
        result = generate_summary(year, month)
        return jsonify({'code': 200, 'data': result})
    except Exception as e:
        return jsonify({'code': 500, 'message': str(e)}), 500


@app.route('/api/ai/llm-summary', methods=['GET'])
def llm_summary():
    """LLM 深度分析报告"""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    try:
        result = llm_analysis(year, month)
        if result is None:
            return jsonify({'code': 400, 'message': 'LLM 未配置，请先设置 API Key'})
        if result.get('error'):
            return jsonify({'code': 500, 'message': result['error']})
        return jsonify({'code': 200, 'data': result})
    except Exception as e:
        return jsonify({'code': 500, 'message': str(e)}), 500


@app.route('/api/ai/comparison', methods=['GET'])
def comparison():
    """月度环比对比"""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    try:
        result = month_comparison(year, month)
        return jsonify({'code': 200, 'data': result})
    except Exception as e:
        return jsonify({'code': 500, 'message': str(e)}), 500


@app.route('/api/ai/anomalies', methods=['GET'])
def anomalies():
    """异常消费检测"""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    threshold = request.args.get('threshold', 2.0, type=float)
    try:
        result = detect_anomalies(year, month, threshold)
        return jsonify({'code': 200, 'data': result})
    except Exception as e:
        return jsonify({'code': 500, 'message': str(e)}), 500


@app.route('/api/ai/prediction', methods=['GET'])
def prediction():
    """月末支出预测"""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    try:
        result = predict_month_end(year, month)
        return jsonify({'code': 200, 'data': result})
    except Exception as e:
        return jsonify({'code': 500, 'message': str(e)}), 500


@app.route('/api/ai/insights', methods=['GET'])
def insights():
    """分类深度洞察"""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    try:
        result = category_insights(year, month)
        return jsonify({'code': 200, 'data': result})
    except Exception as e:
        return jsonify({'code': 500, 'message': str(e)}), 500


# ============================================================
# LLM 配置管理
# ============================================================

@app.route('/api/ai/config', methods=['GET'])
def get_config():
    """获取 LLM 配置状态"""
    return jsonify({'code': 200, 'data': get_config_status()})


@app.route('/api/ai/config', methods=['POST'])
def update_config():
    """更新 LLM 配置"""
    data = request.get_json()
    if not data:
        return jsonify({'code': 400, 'message': '请求数据为空'}), 400

    config = save_config(data)
    return jsonify({
        'code': 200,
        'message': '配置已保存',
        'data': get_config_status(),
    })


@app.route('/api/ai/test-connection', methods=['POST'])
def test_connection():
    """测试 LLM 连接"""
    from llm_client import call_llm
    try:
        result = call_llm(
            '你是一个助手',
            '请回复"连接成功"四个字',
            temperature=0,
            max_tokens=20,
        )
        return jsonify({
            'code': 200,
            'message': f'连接成功！模型回复：{result}',
        })
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': f'连接失败：{str(e)}',
        }), 500


if __name__ == '__main__':
    config = load_config()
    llm_status = '✅ 已启用' if (config.get('enabled') and config.get('api_key')) else '❌ 未配置'
    print('🧠 AI 分析服务启动中...')
    print(f'📡 API: http://localhost:5001/api/ai/')
    print(f'🤖 LLM: {llm_status}')
    print(f'💡 健康检查: http://localhost:5001/api/ai/health')
    app.run(host='0.0.0.0', port=5001, debug=True)
