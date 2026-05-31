import { createApp } from './app.js';
import { InMemoryMetadataRepository } from './repository.js';
import { MetadataService } from './service.js';

const port = Number(process.env.PORT ?? 3000);

const repository = new InMemoryMetadataRepository();
const service = new MetadataService(repository);
const app = createApp(service);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`appmeta API listening on port ${port}`);
});
