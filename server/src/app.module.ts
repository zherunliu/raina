import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AiModule } from "./ai/ai.module";
import { ConfigModule } from "@nestjs/config";
import { UserModule } from "./user/user.module";
import { FileModule } from "./file/file.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AiModule,
    UserModule,
    FileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
