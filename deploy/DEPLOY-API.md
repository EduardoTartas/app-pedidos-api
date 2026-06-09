# Deploy - API App Pedidos

## Build & Push

```bash
cd /caminho/para/app-pedidos-api
docker build -t <seu-usuario>/app_pedidos_api:latest .
docker push <seu-usuario>/app_pedidos_api:latest
```

## Deploy MongoDB (primeira vez)

```bash
kubectl apply -f deploy/pedidos-db.yaml
```

## Deploy Produção

```bash
kubectl apply -f deploy/pedidos-db.yaml
kubectl apply -f deploy/pedidos-configmap.secret.yaml
kubectl apply -f deploy/app-pedidos-api.yaml
```

## Atualizar Produção

```bash
docker build -t <seu-usuario>/app_pedidos_api:latest .
docker push <seu-usuario>/app_pedidos_api:latest
kubectl rollout restart deployment/app-pedidos-api
```

## Deploy QA

```bash
kubectl apply -f deploy/pedidos-qa-configmap.secret.yaml
kubectl apply -f deploy/app-pedidos-api-qa.yaml
kubectl exec -it deployment/app-pedidos-api-qa -- npm run seed
```

## Atualizar QA

```bash
docker build -t <seu-usuario>/app_pedidos_api:latest .
docker push <seu-usuario>/app_pedidos_api:latest
kubectl rollout restart deployment/app-pedidos-api-qa
```

## Deletar

```bash
kubectl delete -f deploy/app-pedidos-api.yaml
kubectl delete -f deploy/pedidos-configmap.secret.yaml
kubectl delete -f deploy/pedidos-db.yaml
kubectl delete -f deploy/app-pedidos-api-qa.yaml
kubectl delete -f deploy/pedidos-qa-configmap.secret.yaml
```

## Verificar

```bash
kubectl get pods | grep pedidos
kubectl logs -f deployment/app-pedidos-api
kubectl logs -f deployment/app-pedidos-api-qa
```

## URLs

- Produção: https://pedidos-api.app.fslab.dev
- QA: https://pedidos-api-qa.app.fslab.dev
