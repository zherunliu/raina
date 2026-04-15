import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { z } from "zod";
import { Code } from "../code";
import { AuthGuard } from "../auth/auth.guard";
import { codeOf, success, type ResponseBody } from "../controller/response";
import { detectLocale } from "../i18n";
import { deleteUserFile, listUserFiles, uploadFile4rag } from "../service/file";

const deleteSchema = z.object({
  filename: z.string().min(1),
});

@Controller("file")
@UseGuards(AuthGuard)
export class FileController {
  @Get("list")
  list(@Req() req: Request): ResponseBody {
    const locale = detectLocale(req);
    const username = (req as Request & { user: { username: string } }).user
      .username;
    const files = listUserFiles(username);
    return success({ files }, locale);
  }

  @Post("delete")
  delete(@Req() req: Request, @Body() body: unknown): ResponseBody {
    const locale = detectLocale(req);
    const username = (req as Request & { user: { username: string } }).user
      .username;
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return codeOf(Code.ParamsInvalid, locale);
    }
    const ok = deleteUserFile(username, parsed.data.filename);
    return ok
      ? success(undefined, locale)
      : codeOf(Code.RecordNotFound, locale);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file", { dest: "uploads/tmp/" }))
  upload(
    @Req() req: Request,
    @UploadedFile()
    file?: {
      originalname: string;
      path: string;
    },
  ): ResponseBody {
    const locale = detectLocale(req);
    if (!file) {
      return codeOf(Code.ParamsInvalid, locale);
    }
    const username = (req as Request & { user: { username: string } }).user
      .username;
    try {
      const filepath = uploadFile4rag(username, file);
      return success({ filepath }, locale);
    } catch {
      // TODO: map specific errors to Code if needed
      return codeOf(Code.ServerError, locale);
    }
  }
}
