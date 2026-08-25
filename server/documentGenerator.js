import path from 'node:path';
import fs from 'node:fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { dataDir } from './db.js';

export const templatesDir = path.join(dataDir, 'templates');

function formatDateOnly(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
}

const MAX_FLATTENED_PEOPLE = 4;

// Builds the flat placeholder object available to .docx templates.
// Keep this in sync with the reference list shown on the Templates page.
export function buildMergeData(vendor, deal, people) {
  const data = {
    company_name: vendor.company_name || '',
    acn_number: vendor.acn_number || '',
    abn_number: vendor.abn_number || '',
    cro_number: vendor.cro_number || '',
    company_address: vendor.company_address || '',
    company_email: vendor.company_email || '',
    sole_owner: vendor.sole_owner || '',
    status: vendor.status || '',

    location: deal?.location || '',
    date_opening: formatDateOnly(deal?.date_opening),
    things_to_do: deal?.things_to_do || '',
    total_deal: deal?.total_deal || '',
    deposit: deal?.deposit || '',
    payment_plan: deal?.payment_plan || '',
    franchise_model: deal?.franchise_model || '',
    contract_shopping_center: deal?.contract_shopping_center || '',
    display_included: deal?.display_included || '',
    training_included: deal?.training_included || '',
    online_shop_included: deal?.online_shop_included || '',
    online_shop_details: deal?.online_shop_details || '',
    stock_price: deal?.stock_price || '',
    retail_price: deal?.retail_price || '',
    wifi_included: deal?.wifi_included || '',
    laptop_included: deal?.laptop_included || '',
    setup_included: deal?.setup_included || '',
    kiosk_size: deal?.kiosk_size || '',
    kiosk_type: deal?.kiosk_type || '',
    stationary_included: deal?.stationary_included || '',

    today_date: formatDateOnly(new Date().toISOString().slice(0, 10)),

    people: (people || []).map((p) => ({
      full_name: p.full_name || '',
      address: p.address || '',
      phone: p.phone || '',
      email: p.email || '',
    })),
  };

  for (let i = 0; i < MAX_FLATTENED_PEOPLE; i += 1) {
    const p = people?.[i];
    const n = i + 1;
    data[`person_${n}_name`] = p?.full_name || '';
    data[`person_${n}_address`] = p?.address || '';
    data[`person_${n}_phone`] = p?.phone || '';
    data[`person_${n}_email`] = p?.email || '';
  }

  return data;
}

export const PLACEHOLDER_REFERENCE = [
  { group: 'Company', tags: ['company_name', 'acn_number', 'abn_number', 'cro_number', 'company_address', 'company_email', 'sole_owner', 'status'] },
  { group: 'Deal Terms', tags: ['location', 'date_opening', 'things_to_do', 'total_deal', 'deposit', 'payment_plan', 'franchise_model', 'contract_shopping_center', 'display_included', 'training_included', 'online_shop_included', 'online_shop_details', 'stock_price', 'retail_price', 'wifi_included', 'laptop_included', 'setup_included', 'kiosk_size', 'kiosk_type', 'stationary_included'] },
  { group: 'People (up to 4, in order added)', tags: ['person_1_name', 'person_1_address', 'person_1_phone', 'person_1_email', 'person_2_name', 'person_2_address', 'person_2_phone', 'person_2_email', 'person_3_name', 'person_3_address', 'person_3_phone', 'person_3_email', 'person_4_name', 'person_4_address', 'person_4_phone', 'person_4_email'] },
  { group: 'Other', tags: ['today_date'] },
];

export class TemplateRenderError extends Error {}

export function generateDocx(templatePath, data) {
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  try {
    doc.render(data);
  } catch (err) {
    const details = err.properties?.errors?.map((e) => e.properties?.explanation).filter(Boolean).join('; ');
    throw new TemplateRenderError(details || err.message);
  }

  return doc.getZip().generate({ type: 'nodebuffer' });
}
