import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readImageSize, hydratePhotos } from '../scripts/photo-metadata.ts';
import { issueSchema } from '../src/lib/issue-schema.ts';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZC8AAAAASUVORK5CYII=',
  'base64',
);

test('image dimensions come from streamed image bytes rather than URL parameters', async () => {
  const image = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(png.subarray(0, 10));
      controller.enqueue(png.subarray(10));
      controller.close();
    },
  });
  const size = await readImageSize(
    'https://example.com/image.png?w=9000&h=8000',
    async () => new Response(image),
  );
  assert.deepEqual(size, { width: 1, height: 1 });
  await assert.rejects(
    readImageSize(
      'https://example.com/missing.png',
      async () => new Response('Not an image'),
    ),
    /无法识别/,
  );
  await assert.rejects(
    readImageSize(
      'https://example.com/missing.png',
      async () => new Response('', { status: 404 }),
    ),
    /HTTP 404/,
  );
});

test('unchanged archived photos reuse verified dimensions without requesting their images again', async () => {
  const work = {
    name: 'Archived',
    userName: 'Photographer',
    image: 'https://example.invalid/would-fail.jpg',
    sourceIds: ['official-id'],
  };
  const archive = issueSchema.parse({
    date: '2026-11-21',
    title: '2026 国内',
    photos: [
      {
        ...work,
        id: 'stable-id',
        picUrl: 'https://example.com/original.jpg',
        width: 1920,
        height: 1440,
      },
    ],
  });
  const result = await hydratePhotos(
    [{ edition: 'domestic', year: '2026', works: [work] }],
    [archive],
  );
  assert.equal(
    result[0].works[0].photo!.picUrl,
    'https://example.com/original.jpg',
  );
  assert.equal(result[0].works[0].photo!.width, 1920);
  assert.equal('photo' in work, false);
});
