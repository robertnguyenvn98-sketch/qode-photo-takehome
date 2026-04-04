import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateCommentDto } from './create-comment.dto';

describe('CreateCommentDto unit', () => {
  it('trims content and passes when between 1 and 500 chars', async () => {
    const dto = plainToInstance(CreateCommentDto, { content: '  hello world  ' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.content).toBe('hello world');
  });

  it('fails when content is empty after trimming', async () => {
    const dto = plainToInstance(CreateCommentDto, { content: '   ' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('fails when content exceeds 500 chars', async () => {
    const dto = plainToInstance(CreateCommentDto, { content: 'x'.repeat(501) });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
