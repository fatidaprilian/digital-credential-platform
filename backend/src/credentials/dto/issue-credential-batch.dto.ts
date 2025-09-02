import { Type } from 'class-transformer';
import { IsArray, ValidateNested, IsDefined } from 'class-validator';
import { IssueCredentialDto } from './issue-credential.dto';

export class IssueCredentialBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssueCredentialDto)
  @IsDefined()
  public batch: IssueCredentialDto[];
}