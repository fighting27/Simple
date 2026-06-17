"""
LLM 客户端 — 调用 OpenAI 兼容 API（Xiaomi MiMo / DeepSeek / OpenAI 等）
自动适配 api-key 和 Authorization 两种认证方式
"""
import json
import urllib.request
import urllib.error
from ai_config_manager import load_config


def call_llm(system_prompt, user_prompt, temperature=0.3, max_tokens=1000, user_id=None):
    """
    调用 LLM API
    返回模型生成的文本内容
    """
    config = load_config(user_id)

    if not config.get('api_key') or not config.get('enabled'):
        return None

    base_url = config['base_url'].rstrip('/')
    url = f"{base_url}/chat/completions"

    payload = {
        'model': config.get('model', 'mimo-v2.5-pro'),
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt},
        ],
        'temperature': temperature,
        'max_tokens': max_tokens,
    }

    # MiMo 用 api-key header，其他平台用 Authorization: Bearer
    api_key = config['api_key']
    headers = {
        'Content-Type': 'application/json',
    }

    if 'xiaomimimo.com' in base_url:
        headers['api-key'] = api_key
    else:
        headers['Authorization'] = f"Bearer {api_key}"

    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            return result['choices'][0]['message']['content']
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        raise Exception(f'LLM API 错误 {e.code}: {body}')
    except urllib.error.URLError as e:
        raise Exception(f'LLM 连接失败: {e.reason}')
    except Exception as e:
        raise Exception(f'LLM 调用异常: {str(e)}')
