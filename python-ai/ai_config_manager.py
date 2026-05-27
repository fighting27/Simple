"""
AI 模型配置管理
优先从 .env.local 读取，回退到 ai_config.json
"""
import json
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'ai_config.json')
ENV_PATH = os.path.join(os.path.dirname(__file__), '.env.local')

DEFAULT_CONFIG = {
    'api_key': '',
    'base_url': 'https://api.deepseek.com/v1',
    'model': 'deepseek-chat',
    'enabled': False,
}


def _read_env_local():
    """从 .env.local 读取配置"""
    config = {}
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip()
    return config


def load_config():
    """加载配置：.env.local 优先 > ai_config.json > 默认值"""
    # 先读 JSON 配置
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = {**DEFAULT_CONFIG, **json.load(f)}
    else:
        config = DEFAULT_CONFIG.copy()

    # .env.local 覆盖（优先级更高）
    env = _read_env_local()
    if env.get('AI_API_KEY'):
        config['api_key'] = env['AI_API_KEY']
    if env.get('AI_BASE_URL'):
        config['base_url'] = env['AI_BASE_URL']
    if env.get('AI_MODEL'):
        config['model'] = env['AI_MODEL']
    if env.get('AI_ENABLED'):
        config['enabled'] = env['AI_ENABLED'].lower() in ('true', '1', 'yes')

    return config


def save_config(data):
    """保存配置到 ai_config.json（不影响 .env.local）"""
    config = load_config()
    allowed = ['api_key', 'base_url', 'model', 'enabled']
    for key in allowed:
        if key in data:
            config[key] = data[key]
    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    return config


def get_config_status():
    """获取配置状态（隐藏 key）"""
    config = load_config()
    key = config.get('api_key', '')
    return {
        'has_key': bool(key),
        'key_preview': f'{key[:8]}...{key[-4:]}' if len(key) > 12 else '***',
        'base_url': config.get('base_url', ''),
        'model': config.get('model', ''),
        'enabled': config.get('enabled', False),
        'source': '.env.local' if os.path.exists(ENV_PATH) else 'ai_config.json',
    }
