addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 解析URL路径以获取token
  const url = new URL(request.url);
  const path = url.pathname.split('/')[1]; // 假设token是路径的第一部分

  // 设置允许的token列表
  const allowedTokens = ['aimedhub', 'yourtoken2']; // 替换为你的实际tokens

  // 检查提供的token是否在允许的列表中
  if (allowedTokens.includes(path)) {
    // 设置原始订阅链接
    const originUrl = 'https://dy.ssysub5.xyz/api/v1/client/subscribe?token=ec6df1627a600ae93db71d1cfd7f2941';

    // 创建新的请求对象，复制原始请求的所有headers
    let newRequestHeaders = new Headers(request.headers);

    // 可以选择添加或修改headers
    newRequestHeaders.set('Host', 'up.aidns.org');
    newRequestHeaders.set('Referer', 'https://up.aidns.org/');

    // 使用原始请求的方法和新的headers创建新请求
    const newRequest = new Request(originUrl, {
      method: request.method,
      headers: newRequestHeaders
    });

    try {
      // 向原始订阅链接发送请求并获取响应
      const response = await fetch(newRequest);

      // 获取用户信息
      const ipAddress = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For');
      const userAgent = request.headers.get('User-Agent');
      const country = request.headers.get('CF-IPCountry');
      const deviceInfo = userAgent; // User-Agent 通常包含设备信息

      // 获取IP详细信息
      const ipInfo = await getIpInfo(ipAddress);

      // 构造消息内容
      const message = `
New subscription download:
IP: ${ipAddress}
Device: ${deviceInfo}
Country: ${country}
国家: ${ipInfo.country}
城市: ${ipInfo.city}
组织: ${ipInfo.org}
ASN: ${ipInfo.as}
域名: ${ipInfo.reverse}
      `;

      // 发送订阅下载通知到Telegram
      await sendTelegramMessage(message);

      // 返回获取的响应
      return response;
    } catch (error) {
      // 发送错误消息到Telegram
      await sendTelegramMessage('Error on subscription request: ' + error.message);

      // 错误处理，返回错误信息
      return new Response('Error fetching the data: ' + error.message, { status: 500 });
    }
  } else {
    // 发送非法访问警告到Telegram
    await sendTelegramMessage('Unauthorized access attempt.');

    // 如果token不在允许的列表中，返回错误信息
    return new Response('Unauthorized access', { status: 401 });
  }
}

async function getIpInfo(ip) {
  const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
  const data = await response.json();
  return {
    ip: data.query,
    country: data.country,
    city: data.city,
    org: data.org,
    as: data.as,
    reverse: data.reverse
  };
}

async function sendTelegramMessage(message) {
  const telegramToken = '7112841910:AAHzHgOd8bugIS4PHySy_S0o94xnBR5wcoE'; // 替换为你的Telegram机器人Token
  const chatId = '6590320173'; // 替换为你的Telegram Chat ID
  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message
    })
  });
}
