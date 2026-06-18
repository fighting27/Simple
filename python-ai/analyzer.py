"""
AI 智能分析引擎
功能：趋势对比、异常检测、月末预测、分类洞察、自然语言摘要
"""
import math
from datetime import datetime, date
from collections import defaultdict

from db_reader import (
    get_monthly_expenses, get_monthly_income,
    get_category_expenses, get_daily_expenses,
    get_transactions, get_settings
)


# ============================================================
# 1. 月度趋势对比（环比分析）
# ============================================================

def month_comparison(year=None, month=None, user_id=None):
    """
    本月 vs 上月 对比分析
    返回：总收入/总支出/各分类变化/环比增减百分比
    """
    today = date.today()
    if not year:
        year = today.year
    if not month:
        month = today.month

    # 本月数据
    this_month_cats = get_category_expenses(year, month, user_id=user_id)
    this_month_daily = get_daily_expenses(year, month, user_id=user_id)
    this_month_expense = sum(c['total'] for c in this_month_cats)
    this_month_income = get_monthly_income(year, user_id=user_id).get(month, 0)

    # 上月数据
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    prev_month_cats = get_category_expenses(prev_year, prev_month, user_id=user_id)
    prev_month_daily = get_daily_expenses(prev_year, prev_month, user_id=user_id)
    prev_month_expense = sum(c['total'] for c in prev_month_cats)

    # 分类对比
    prev_cat_map = {c['category']: c['total'] for c in prev_month_cats}
    category_changes = []
    for cat in this_month_cats:
        name = cat['category']
        current = cat['total']
        previous = prev_cat_map.get(name, 0)
        change_pct = ((current - previous) / previous * 100) if previous > 0 else (100.0 if current > 0 else 0.0)
        category_changes.append({
            'category': name,
            'current': round(current, 2),
            'previous': round(previous, 2),
            'change': round(current - previous, 2),
            'change_pct': round(change_pct, 1),
        })

    # 按变化幅度排序（涨得最多的在前）
    category_changes.sort(key=lambda x: x['change'], reverse=True)

    # 环比
    overall_change_pct = (
        ((this_month_expense - prev_month_expense) / prev_month_expense * 100)
        if prev_month_expense > 0 else 0.0
    )

    return {
        'year': year,
        'month': month,
        'this_month': {
            'expense': round(this_month_expense, 2),
            'income': round(this_month_income, 2),
            'daily_avg': round(this_month_expense / max(today.day, 1), 2),
            'days_with_data': len(this_month_daily),
        },
        'last_month': {
            'expense': round(prev_month_expense, 2),
            'month': prev_month,
        },
        'overall_change_pct': round(overall_change_pct, 1),
        'category_changes': category_changes,
    }


# ============================================================
# 2. 异常消费检测
# ============================================================

def detect_anomalies(year=None, month=None, threshold=2.0, user_id=None):
    """
    检测异常消费（基于历史均值的 Z-score）
    threshold: 标准差倍数，2.0 表示超过2倍标准差视为异常
    """
    today = date.today()
    if not year:
        year = today.year
    if not month:
        month = today.month

    # 获取最近 6 个月的每日消费
    all_daily = {}
    for i in range(6):
        m = month - i
        y = year
        while m <= 0:
            m += 12
            y -= 1
        daily = get_daily_expenses(y, m, user_id=user_id)
        for day, amount in daily.items():
            key = f"{y}-{m:02d}-{day:02d}"
            all_daily[key] = amount

    if len(all_daily) < 7:
        return {'anomalies': [], 'message': '数据不足，需要至少7天的消费记录'}

    # 计算均值和标准差
    values = list(all_daily.values())
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    std = math.sqrt(variance) if variance > 0 else 1

    # 找出本月异常天
    this_month_daily = get_daily_expenses(year, month, user_id=user_id)
    anomalies = []
    for day, amount in this_month_daily.items():
        z_score = (amount - mean) / std if std > 0 else 0
        if z_score >= threshold:
            # 找这天的消费明细
            day_str = f"{year}-{month:02d}-{day:02d}"
            day_transactions = get_transactions(start_date=day_str, end_date=day_str, type_filter='expense', user_id=user_id)
            top_expenses = sorted(day_transactions, key=lambda t: t['amount'], reverse=True)[:3]

            anomalies.append({
                'date': day_str,
                'amount': round(amount, 2),
                'avg': round(mean, 2),
                'z_score': round(z_score, 2),
                'top_expenses': [{
                    'amount': t['amount'],
                    'category': t['category_name'],
                    'note': t['note'] or ''
                } for t in top_expenses],
            })

    anomalies.sort(key=lambda a: a['z_score'], reverse=True)

    return {
        'anomalies': anomalies,
        'daily_avg': round(mean, 2),
        'daily_std': round(std, 2),
        'threshold': threshold,
    }


# ============================================================
# 3. 月末支出预测
# ============================================================

def predict_month_end(year=None, month=None, user_id=None):
    """
    基于历史趋势 + 本月已消费，预测月末总支出
    使用加权移动平均法
    """
    today = date.today()
    if not year:
        year = today.year
    if not month:
        month = today.month

    # 本月已消费
    this_month_daily = get_daily_expenses(year, month, user_id=user_id)
    spent_so_far = sum(this_month_daily.values())
    days_elapsed = len(this_month_daily)

    if days_elapsed == 0:
        return {
            'spent_so_far': 0,
            'days_elapsed': 0,
            'days_in_month': 30,
            'daily_avg': 0,
            'predicted_total': 0,
            'confidence': 'low',
            'history_months': [],
            'budget_status': None,
        }

    # 获取过去 3 个月的月度总支出
    history = []
    for i in range(1, 4):
        m = month - i
        y = year
        while m <= 0:
            m += 12
            y -= 1
        monthly = get_monthly_expenses(y, user_id=user_id)
        if m in monthly:
            history.append(monthly[m])

    # 本月天数
    if month == 12:
        days_in_month = 31
    else:
        days_in_month = (date(year, month + 1, 1) - date(year, month, 1)).days

    # 简单预测：用本月日均 × 本月天数
    daily_avg_this = spent_so_far / days_elapsed
    simple_predict = daily_avg_this * days_in_month

    # 加权预测：结合历史月均
    if history:
        history_avg = sum(history) / len(history)
        # 本月进度权重 + 历史权重
        progress = days_elapsed / days_in_month
        weight_current = min(0.3 + progress * 0.5, 0.8)  # 越到月末越相信当前数据
        weight_history = 1 - weight_current
        weighted_predict = simple_predict * weight_current + history_avg * weight_history
    else:
        weighted_predict = simple_predict

    # 置信度
    if days_elapsed >= 20:
        confidence = 'high'
    elif days_elapsed >= 10:
        confidence = 'medium'
    else:
        confidence = 'low'

    # 预算对比
    settings = get_settings(user_id=user_id)
    monthly_budget = float(settings.get('monthly_budget', 0))
    budget_status = None
    if monthly_budget > 0:
        budget_pct = (weighted_predict / monthly_budget) * 100
        if budget_pct > 100:
            budget_status = {
                'status': 'over',
                'message': f'预计超支 ¥{weighted_predict - monthly_budget:.0f}',
                'percentage': round(budget_pct, 1),
            }
        elif budget_pct > 80:
            budget_status = {
                'status': 'warning',
                'message': f'已用 {budget_pct:.0f}%，注意控制',
                'percentage': round(budget_pct, 1),
            }
        else:
            budget_status = {
                'status': 'safe',
                'message': f'预算充裕，剩余 ¥{monthly_budget - weighted_predict:.0f}',
                'percentage': round(budget_pct, 1),
            }

    return {
        'spent_so_far': round(spent_so_far, 2),
        'days_elapsed': days_elapsed,
        'days_in_month': days_in_month,
        'daily_avg': round(daily_avg_this, 2),
        'predicted_total': round(weighted_predict, 2),
        'confidence': confidence,
        'history_months': [round(h, 2) for h in history],
        'budget_status': budget_status,
    }


# ============================================================
# 4. 分类深度洞察
# ============================================================

def category_insights(year=None, month=None, user_id=None):
    """
    对各消费分类做深度分析：
    - 占比变化
    - 高频消费
    - 建议
    """
    today = date.today()
    if not year:
        year = today.year
    if not month:
        month = today.month

    this_month_cats = get_category_expenses(year, month, user_id=user_id)
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    prev_month_cats = get_category_expenses(prev_year, prev_month, user_id=user_id)

    total_this = sum(c['total'] for c in this_month_cats) or 1
    total_prev = sum(c['total'] for c in prev_month_cats) or 1

    prev_cat_map = {c['category']: c for c in prev_month_cats}

    insights = []
    for cat in this_month_cats:
        name = cat['category']
        amount = cat['total']
        count = cat['count']
        pct = amount / total_this * 100

        prev = prev_cat_map.get(name)
        prev_amount = prev['total'] if prev else 0
        prev_pct = (prev_amount / total_prev * 100) if prev else 0

        # 占比变化
        pct_change = pct - prev_pct

        # 生成建议
        suggestion = _generate_suggestion(name, amount, pct, pct_change, count)

        insights.append({
            'category': name,
            'amount': round(amount, 2),
            'count': count,
            'percentage': round(pct, 1),
            'prev_amount': round(prev_amount, 2),
            'prev_percentage': round(prev_pct, 1),
            'pct_change': round(pct_change, 1),
            'avg_per_transaction': round(amount / count, 2) if count > 0 else 0,
            'suggestion': suggestion,
        })

    insights.sort(key=lambda x: x['amount'], reverse=True)
    return insights


def _generate_suggestion(name, amount, pct, pct_change, count):
    """根据分类数据生成建议"""
    suggestions = []

    if pct_change > 5:
        suggestions.append(f'占比上升 {pct_change:.1f}%，需要关注')
    elif pct_change < -5:
        suggestions.append(f'占比下降 {abs(pct_change):.1f}%，控制得不错')

    if pct > 30:
        suggestions.append(f'占总支出 {pct:.0f}%，比例偏高')
    if count > 0 and amount / count > 100:
        suggestions.append(f'单笔均 ¥{amount/count:.0f}，偏高')

    # 分类特定建议
    category_tips = {
        '餐饮': '可以试试自己做饭，能省不少',
        '交通': '短途可以考虑骑车或步行',
        '购物': '购物前想想是否真的需要',
        '娱乐': '适度娱乐，注意预算',
        '外卖': '外卖比堂食贵，可以减少频次',
        '水果': '可以去批发市场或社区团购',
    }
    if name in category_tips and pct > 15:
        suggestions.append(category_tips[name])

    return '；'.join(suggestions) if suggestions else '正常范围'


# ============================================================
# 5. 综合报告 + 自然语言摘要
# ============================================================

def generate_summary(year=None, month=None, user_id=None):
    """
    生成一份综合智能分析报告
    """
    comp = month_comparison(year, month, user_id=user_id)
    anomalies = detect_anomalies(year, month, user_id=user_id)
    prediction = predict_month_end(year, month, user_id=user_id)
    insights = category_insights(year, month, user_id=user_id)

    # 生成自然语言摘要
    summary_lines = []

    # 开头
    summary_lines.append(f"📊 {comp['year']}年{comp['month']}月 记账分析报告")

    # 总体趋势
    change = comp['overall_change_pct']
    if change > 10:
        summary_lines.append(f"⚠️ 本月支出环比上涨 {change}%，需要控制")
    elif change > 0:
        summary_lines.append(f"📈 本月支出环比小幅上涨 {change}%")
    elif change < -10:
        summary_lines.append(f"🎉 本月支出环比下降 {abs(change)}%，做得好！")
    elif change < 0:
        summary_lines.append(f"📉 本月支出环比小幅下降 {abs(change)}%")
    else:
        summary_lines.append("➡️ 本月支出与上月持平")

    # 本月已花 / 预测
    summary_lines.append(
        f"💰 本月已花 ¥{prediction['spent_so_far']:.0f}，"
        f"日均 ¥{prediction['daily_avg']:.0f}，"
        f"预计月末 ¥{prediction['predicted_total']:.0f}"
    )

    # 预算状态
    if prediction['budget_status']:
        bs = prediction['budget_status']
        if bs['status'] == 'over':
            summary_lines.append(f"🚨 {bs['message']}")
        elif bs['status'] == 'warning':
            summary_lines.append(f"⚠️ {bs['message']}")
        else:
            summary_lines.append(f"✅ {bs['message']}")

    # 异常
    if anomalies.get('anomalies'):
        top = anomalies['anomalies'][0]
        summary_lines.append(
            f"🔍 发现 {len(anomalies['anomalies'])} 天异常消费，"
            f"最严重的是 {top['date']}，花了 ¥{top['amount']:.0f}（日均 ¥{anomalies['daily_avg']:.0f}）"
        )

    # Top 3 分类
    if insights:
        top3 = insights[:3]
        cats_str = '、'.join(f"{c['category']} ¥{c['amount']:.0f}({c['percentage']:.0f}%)" for c in top3)
        summary_lines.append(f"🏷️ 支出前三：{cats_str}")

    # 分类建议
    for cat in insights[:6]:
        if cat['pct_change'] > 10:
            summary_lines.append(f"📌 {cat['category']}占比上升明显，{cat['suggestion']}")

    return {
        'summary': '\n'.join(summary_lines),
        'comparison': comp,
        'anomalies': anomalies,
        'prediction': prediction,
        'insights': insights,
    }


# ============================================================
# 6. LLM 增强分析（调用大模型 API）
# ============================================================

def _build_finance_context(year=None, month=None, user_id=None):
    """组装 LLM 可读的账目上下文。"""
    comp = month_comparison(year, month, user_id=user_id)
    prediction = predict_month_end(year, month, user_id=user_id)
    insights = category_insights(year, month, user_id=user_id)
    anomalies = detect_anomalies(year, month, user_id=user_id)

    rising = [cat for cat in insights if cat['pct_change'] > 0]
    rising.sort(key=lambda item: item['pct_change'], reverse=True)

    falling = [cat for cat in insights if cat['pct_change'] < 0]
    falling.sort(key=lambda item: item['pct_change'])

    data_context = f"""以下是用户 {comp['year']}年{comp['month']}月 的记账数据：

【收支概览】
- 本月支出：¥{comp['this_month']['expense']}
- 本月收入：¥{comp['this_month']['income']}
- 日均消费：¥{comp['this_month']['daily_avg']}
- 有消费记录天数：{comp['this_month']['days_with_data']} 天
- 上月支出：¥{comp['last_month']['expense']}
- 支出环比：{comp['overall_change_pct']}%

【月末预测】
- 已花费：¥{prediction['spent_so_far']}
- 已记账天数：{prediction['days_elapsed']} / {prediction['days_in_month']}
- 预计月末总支出：¥{prediction['predicted_total']}
- 预测置信度：{prediction['confidence']}
- 预算状态：{(prediction.get('budget_status') or {}).get('message', '未设置预算')}

【分类明细】"""

    for cat in insights:
        data_context += (
            f"\n- {cat['category']}：¥{cat['amount']}，占比 {cat['percentage']}%，"
            f"{cat['count']} 笔，单笔均 ¥{cat['avg_per_transaction']}，"
            f"占比环比 {cat['pct_change']:+.1f}%，建议：{cat['suggestion']}"
        )

    if rising:
        data_context += "\n\n【上涨最明显分类】"
        for cat in rising[:3]:
            data_context += f"\n- {cat['category']}：占比增加 {cat['pct_change']:.1f} 个百分点，当前 ¥{cat['amount']}"

    if falling:
        data_context += "\n\n【下降最明显分类】"
        for cat in falling[:3]:
            data_context += f"\n- {cat['category']}：占比下降 {abs(cat['pct_change']):.1f} 个百分点，当前 ¥{cat['amount']}"

    if anomalies.get('anomalies'):
        data_context += "\n\n【异常消费】"
        for a in anomalies['anomalies'][:5]:
            detail = '、'.join(f"{e['category']} ¥{e['amount']}" for e in a.get('top_expenses', []))
            data_context += f"\n- {a['date']}：¥{a['amount']}，超出日均 {a['z_score']}σ，主要项目：{detail or '无明细'}"
    else:
        data_context += f"\n\n【异常消费】{anomalies.get('message', '未发现明显异常消费')}"

    return comp, prediction, insights, anomalies, data_context


def llm_analysis(year=None, month=None, user_id=None):
    """
    用 LLM 生成深度分析报告
    返回：规则分析 + LLM 生成的洞察
    """
    from llm_client import call_llm
    from ai_config_manager import load_config

    config = load_config(user_id)
    if not config.get('api_key') or not config.get('enabled'):
        return None

    comp, prediction, insights, anomalies, data_context = _build_finance_context(year, month, user_id=user_id)

    system_prompt = """你是一个专业、务实的个人财务分析师。根据用户的记账数据，输出一份有参考价值的分析报告。

要求：
1. 用中文回答，语气直接、亲切、不过度夸张
2. 必须引用具体金额、占比、环比、日期或分类，不要写空泛建议
3. 固定输出 5 个段落，每段以【本月结论】【主要变化】【风险提醒】【可执行动作】【下周关注】开头
4. 可执行动作必须具体到分类、金额或频次，例如“外卖减少 2 次”这种级别
5. 如果数据不足，要明确说明不足，并给出仍可执行的记账建议
6. 控制在 500 字以内，不使用 markdown 表格"""

    try:
        llm_result = call_llm(
            system_prompt,
            data_context,
            temperature=0.25,
            max_tokens=1400,
            user_id=user_id,
            timeout=55,
            return_metadata=True
        )
        if llm_result:
            if isinstance(llm_result, dict):
                content = llm_result.get('content') or ''
                finish_reason = llm_result.get('finish_reason')
            else:
                content = llm_result
                finish_reason = None

            if finish_reason == 'length' and content:
                continue_prompt = (
                    "下面这份财务分析报告因为输出长度限制被截断了。"
                    "请只从断点继续写完剩余内容，不要重复已经写过的内容，不要添加寒暄。\n\n"
                    f"【已生成内容】\n{content}\n\n"
                    f"【原始账目上下文】\n{data_context}"
                )
                continuation = call_llm(
                    system_prompt,
                    continue_prompt,
                    temperature=0.2,
                    max_tokens=700,
                    user_id=user_id,
                    timeout=35,
                    return_metadata=True
                )
                if isinstance(continuation, dict):
                    continuation = continuation.get('content') or ''
                if continuation:
                    content = f"{content.rstrip()}{continuation.lstrip()}"

            return {
                'llm_summary': content,
                'model': config.get('model', ''),
                'base_data': {
                    'comparison': comp,
                    'prediction': prediction,
                    'insights': insights,
                    'anomalies': anomalies,
                }
            }
    except Exception as e:
        return {
            'llm_summary': None,
            'error': str(e),
            'base_data': {
                'comparison': comp,
                'prediction': prediction,
                'insights': insights,
                'anomalies': anomalies,
            }
        }

    return None


def llm_chat(question, year=None, month=None, user_id=None):
    """基于当前账目上下文回答用户问题。"""
    from datetime import datetime
    from llm_client import call_llm
    from ai_config_manager import load_config

    config = load_config(user_id)
    if not config.get('api_key') or not config.get('enabled'):
        return None

    comp, prediction, insights, anomalies, data_context = _build_finance_context(year, month, user_id=user_id)
    now = datetime.now()
    current_date = now.strftime('%Y-%m-%d')
    weekday = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'][now.weekday()]
    system_prompt = """你是记账应用里的 AI 对话助手，兼具个人财务助手能力。

回答规则：
1. 用户问账目、预算、分类、异常、趋势时，引用具体数字回答
2. 用户问能否记账或修改账目时，说明需要在页面确认后执行，不要声称已经入账
3. 用户问日期、星期、普通常识或闲聊时，可以按通用 AI 助手方式直接回答，不要强行说账本数据无法判断
4. 财务类问题只能基于提供的记账数据回答，不要编造不存在的账目
5. 如果财务问题超出数据范围，说明当前数据无法判断，并给出可以查看的方向
6. 用中文，简洁自然，最多 180 字"""

    user_prompt = f"【当前日期】{current_date} {weekday}\n\n{data_context}\n\n【用户问题】\n{question}"
    answer = call_llm(system_prompt, user_prompt, temperature=0.2, max_tokens=400, user_id=user_id, timeout=45)
    return {
        'answer': answer,
        'model': config.get('model', ''),
        'base_data': {
            'comparison': comp,
            'prediction': prediction,
            'insights': insights,
            'anomalies': anomalies,
        }
    }
