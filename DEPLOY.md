# 部署指南

Demo 需要保持可访问到 **2026-12-31**。以下三种方式任选其一，推荐 A（最可控）。

> 共同前提：服务器可访问 `https://api.aholo3d.cn`，并配置环境变量 `AHOLO_API_KEY`。
> 不要把密钥写进镜像、仓库或前端。

---

## A. 单机 Docker（推荐，2 核 2G 起）

```bash
# 1. 上传代码
scp -r . user@server:/srv/useless-evolution

# 2. 构建并启动
cd /srv/useless-evolution
docker build -t useless-evolution .
docker run -d --name useless \
  --restart unless-stopped \
  -p 8787:8787 \
  -e AHOLO_API_KEY=你的密钥 \
  -v /srv/useless-models:/data/models \
  -e MODEL_DIR=/data/models \
  useless-evolution

# 3. 验证
curl http://127.0.0.1:8787/api/health
```

`-v` 挂载保证容器重建后已生成的 GLB 不丢失。首次启动时可以把本地
`public/models/` 复制到 `/srv/useless-models`，这样示范链直接命中缓存：

```bash
scp -r public/models/* user@server:/srv/useless-models/
```

### Nginx + HTTPS

```nginx
server {
  server_name demo.example.com;
  client_max_body_size 20m;

  location / {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
  }
}
```

```bash
certbot --nginx -d demo.example.com
```

---

## B. Render / Railway（托管 Docker）

1. 新建 Web Service，选择本仓库，Runtime 选 Docker。
2. 环境变量：`AHOLO_API_KEY`、`MODEL_DIR=/data/models`、`PORT=8787`。
3. 添加 Persistent Disk，挂载到 `/data`（至少 2 GB）。
4. 健康检查路径：`/api/health`。

注意：无持久盘的免费实例在重启后会丢失已生成的 GLB，但不会影响规则与谱系；
只是示范链需要重新生成。

---

## C. 仅内网演示（不推荐作为提交链接）

```bash
npm install
npm run build
npm start          # http://0.0.0.0:8787
```

用同一局域网 IP 访问即可；外网评审无法打开，因此只适合现场演示。

---

## 部署后自检

- [ ] `GET /api/health` 返回 `{ ok: true, key: "configured" }`
- [ ] 打开 `https://你的域名/?demo=cup`，3 秒内出现已缓存的封口水杯 GLB
- [ ] 点“无用性测试”，动画与文案正常
- [ ] 点“分享”，链接可在新无痕窗口复现同一条谱系
- [ ] 选一个未缓存的节点，点“用 Lux3D 生成”，能创建任务并在 2–6 分钟内出模型
- [ ] 重启容器后，已生成的模型仍可访问
- [ ] 浏览器控制台无报错，`AHOLO_API_KEY` 不出现在任何网络响应中

## 成本与限额

- Lux3D 单次生成约 2–6 分钟；平台可能限制同时 1 个任务，前端已串行化。
- 预生成 12 个示范资产约消耗 12 次生成额度；之后玩家点击缓存节点不再消耗。
- 单个 GLB 原始约 11 MB，压缩后约 0.7 MB；12 个资产合计约 8–10 MB。

## 回滚

```bash
docker rm -f useless
docker run -d --name useless ... useless-evolution:previous
```

模型目录独立挂载，回滚镜像不影响已有资产。
