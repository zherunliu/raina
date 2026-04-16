import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { initMysql } from "./db/mysql";
import { initCache } from "./db/cache";
import { loadDataFromDb } from "./bootstrap/load-history";
import { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  // Align with raina: all APIs are under /api/v1/...
  app.setGlobalPrefix("api/v1");

  // Align with raina: initialize infrastructure before serving traffic.
  await initMysql();
  await loadDataFromDb();
  await initCache();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch(() => process.exit(1));
