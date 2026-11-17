const { pick, string, url, bool, invalid } = require('./catalogData');
const SINGLETON_ID = '000000000000000000000001';

async function readContent(Model) {
  const canonical = await Model.findById(SINGLETON_ID);
  if (canonical) return canonical;
  return await Model.findOne().sort({ _id: 1 }) || new Model({ _id: SINGLETON_ID }).toObject();
}

function contentPayload(Model, body) {
  const fields = Object.keys(Model.schema.paths).filter((key) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key) && !key.includes('.'));
  const payload = pick(body, fields);
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'showEvent') { payload[key] = bool(value, key); continue; }
    if (['customerPhotos', 'contactImages'].includes(key)) {
      if (!Array.isArray(value) || value.length > 30) throw invalid(`${key} must contain up to 30 image URLs.`);
      payload[key] = [...new Set(value.map((item) => url(item, key)))]; continue;
    }
    if (key === 'topGems') {
      if (!Array.isArray(value) || value.length > 20) throw invalid('Top gems must contain up to 20 items.');
      payload[key] = value.map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw invalid('Each top gem must contain its image and name.');
        return { image: url(item.image, 'Top gem image'), name: string(item.name || '', 'Top gem name', { max: 200 }), weight: string(item.weight || '', 'Top gem weight', { max: 40 }) };
      }); continue;
    }
    if (/Image$|Video$|Link$/.test(key)) { payload[key] = url(value, key, { optional: true }); continue; }
    payload[key] = string(value, key, { max: ['brandIntro', 'eventText'].includes(key) ? 10000 : 2000 });
  }
  return payload;
}

async function saveContent(Model, body) {
  const payload = contentPayload(Model, body);
  const current = await readContent(Model);
  const plain = typeof current.toObject === 'function' ? current.toObject() : current;
  const inherited = pick(plain, Object.keys(Model.schema.paths).filter((key) => !['_id','__v','createdAt','updatedAt'].includes(key) && !key.includes('.')));
  // Preserve old singleton content, but converge all new writes on one unique _id.
  const onInsert = Object.fromEntries(Object.entries(inherited).filter(([key]) => !Object.hasOwn(payload, key)));
  try {
    return await Model.findOneAndUpdate({ _id: SINGLETON_ID }, { $set: payload, $setOnInsert: onInsert }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    return Model.findOneAndUpdate({ _id: SINGLETON_ID }, { $set: payload }, { new: true, runValidators: true });
  }
}

module.exports = { SINGLETON_ID, readContent, contentPayload, saveContent };
