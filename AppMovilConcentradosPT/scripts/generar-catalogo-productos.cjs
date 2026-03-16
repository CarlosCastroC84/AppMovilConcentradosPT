const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const docsDir = path.resolve(projectRoot, 'docs');
const baseUrl = 'https://concentrados-app-imagenes-517329182634-us-east-2-an.s3.us-east-2.amazonaws.com';
const timestamp = '2026-03-16T00:00:00.000Z';
const defaultStock = 24;

const presentationSuffixes = {
  'Bulto': 'bulto',
  '1/2 Bulto': 'medio-bulto',
  '@': 'arroba',
  '1/2 @': 'media-arroba',
  'Libra': 'libra',
  'Unidad': 'unidad'
};

function slug(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[."']/g, '')
    .replace(/\//g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sanitizeImageName(value) {
  return value
    .replace(/\//g, '-')
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function encodeSegment(segment) {
  return encodeURIComponent(segment).replace(/%20/g, '+');
}

function buildImageKey(folder, imageName) {
  return `productos/${folder}/${sanitizeImageName(imageName)}.png`;
}

function buildImageUrl(imageKey) {
  return `${baseUrl}/${imageKey.split('/').map(encodeSegment).join('/')}`;
}

function createVariantProducts(definition) {
  const { name, category, brand, folder, imageName = name, variants } = definition;
  const hasMultipleVariants = variants.length > 1;

  return variants.map(([presentation, price]) => {
    const imageKey = buildImageKey(folder, imageName);
    const suffix = presentationSuffixes[presentation] || slug(presentation);
    const candidateId = hasMultipleVariants || presentation !== 'Bulto'
      ? `${slug(name)}-${suffix}`
      : slug(name);

    return {
      id: candidateId,
      nombre: name,
      categoria: category,
      marca: brand,
      presentacion: presentation,
      precio: price,
      estado: 'ACTIVO',
      stock: defaultStock,
      imagenKey: imageKey,
      imagenUrl: buildImageUrl(imageKey),
      descripcion: '',
      createdAt: timestamp,
      updatedAt: timestamp
    };
  });
}

function ensureUniqueIds(products) {
  const seen = new Set();

  return products.map(product => {
    let resolvedId = product.id;

    if (seen.has(resolvedId)) {
      const brandPrefixed = `${slug(product.marca)}-${resolvedId}`;
      if (!seen.has(brandPrefixed)) {
        resolvedId = brandPrefixed;
      } else {
        const categoryPrefixed = `${slug(product.categoria)}-${resolvedId}`;
        if (!seen.has(categoryPrefixed)) {
          resolvedId = categoryPrefixed;
        } else {
          let counter = 2;
          while (seen.has(`${resolvedId}-${counter}`)) {
            counter += 1;
          }
          resolvedId = `${resolvedId}-${counter}`;
        }
      }
    }

    seen.add(resolvedId);
    return {
      ...product,
      id: resolvedId
    };
  });
}

function toAttributeValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return {
      L: value
        .map(item => toAttributeValue(item))
        .filter(item => item !== null)
    };
  }

  if (typeof value === 'number') {
    return { N: String(value) };
  }

  if (typeof value === 'boolean') {
    return { BOOL: value };
  }

  if (typeof value === 'object') {
    const mapValue = Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
      const attributeValue = toAttributeValue(nestedValue);
      if (attributeValue !== null) {
        accumulator[key] = attributeValue;
      }
      return accumulator;
    }, {});

    return { M: mapValue };
  }

  return { S: String(value) };
}

function toDynamoItem(product) {
  return Object.entries(product).reduce((accumulator, [key, value]) => {
    const attributeValue = toAttributeValue(value);
    if (attributeValue !== null) {
      accumulator[key] = attributeValue;
    }
    return accumulator;
  }, {});
}

const productDefinitions = [
  { name: 'Vaca 20', category: 'Ganaderia', brand: 'Italcol', folder: 'GANADERÍA', variants: [['Bulto', 78000]] },
  { name: 'Cremosa FD', category: 'Ganaderia', brand: 'Italcol', folder: 'GANADERÍA', variants: [['Bulto', 63000]] },
  { name: 'Superternera', category: 'Ganaderia', brand: 'Italcol', folder: 'GANADERÍA', variants: [['Bulto', 79000]] },

  { name: 'Pollito Pre-iniciador', category: 'Pollo Engorde', brand: 'Italcol', folder: 'POLLO ENGORDE', variants: [['Bulto', 98000], ['1/2 Bulto', 50000], ['@', 38000], ['1/2 @', 19000], ['Libra', 1500]] },
  { name: 'Super Pollito', category: 'Pollo Engorde', brand: 'Italcol', folder: 'POLLO ENGORDE', variants: [['Bulto', 99000], ['1/2 Bulto', 51000], ['@', 38000], ['1/2 @', 19000], ['Libra', 1600]] },
  { name: 'Super Pollo Engorde', category: 'Pollo Engorde', brand: 'Italcol', folder: 'POLLO ENGORDE', variants: [['Bulto', 100000], ['1/2 Bulto', 51000], ['@', 38000], ['1/2 @', 19000], ['Libra', 1600]] },
  { name: 'Pollito Iniciación', category: 'Pollo Engorde', brand: 'Italcol', folder: 'POLLO ENGORDE', variants: [['Bulto', 81000], ['1/2 Bulto', 42000]] },
  { name: 'Pollo Engorde', category: 'Pollo Engorde', brand: 'Italcol', folder: 'POLLO ENGORDE', variants: [['Bulto', 79000], ['1/2 Bulto', 41000]] },
  { name: '20K Pollito Pre-inicio', category: 'Pollo Engorde', brand: 'Italcol', folder: 'POLLO ENGORDE', variants: [['Bulto', 54000]] },

  { name: 'Cerdito Pre-iniciador', category: 'Porcicultura', brand: 'Italcol', folder: 'PORCICULTURA', variants: [['Bulto', 161000], ['1/2 Bulto', 82000]] },
  { name: 'Cerdito Iniciación', category: 'Porcicultura', brand: 'Italcol', folder: 'PORCICULTURA', variants: [['Bulto', 105000], ['1/2 Bulto', 54000]] },
  { name: 'Cerdo Levante', category: 'Porcicultura', brand: 'Italcol', folder: 'PORCICULTURA', variants: [['Bulto', 92000], ['1/2 Bulto', 47000]] },
  { name: 'Cerdo Engorde', category: 'Porcicultura', brand: 'Italcol', folder: 'PORCICULTURA', variants: [['Bulto', 86000], ['1/2 Bulto', 44000]] },
  { name: 'Cerdo Finalizador', category: 'Porcicultura', brand: 'Italcol', folder: 'PORCICULTURA', variants: [['Bulto', 89000], ['1/2 Bulto', 46000]] },
  { name: 'Cerda Gestación', category: 'Porcicultura', brand: 'Italcol', folder: 'PORCICULTURA', variants: [['Bulto', 82000], ['1/2 Bulto', 43000]] },
  { name: 'Cerda Lactancia', category: 'Porcicultura', brand: 'Italcol', folder: 'PORCICULTURA', variants: [['Bulto', 88000], ['1/2 Bulto', 45000]] },
  { name: '20K Cerdito Pre-inicio', category: 'Porcicultura', brand: 'Italcol', folder: 'PORCICULTURA', variants: [['Bulto', 76500]] },

  { name: 'Furia Total', category: 'Equinos', brand: 'Italcol', folder: 'EQUINOS', variants: [['Bulto', 71000]] },

  { name: 'Mojarra 45 HNA', category: 'Acuicultura', brand: 'Italcol', folder: 'ACUICULTURA', variants: [['Bulto', 175000], ['1/2 Bulto', 89000], ['@', 63000], ['1/2 @', 31500]] },
  { name: 'Mojarra 45 EXT', category: 'Acuicultura', brand: 'Italcol', folder: 'ACUICULTURA', variants: [['Bulto', 178000], ['1/2 Bulto', 90000], ['@', 65000], ['1/2 @', 35500]] },
  { name: 'Mojarra 38', category: 'Acuicultura', brand: 'Italcol', folder: 'ACUICULTURA', variants: [['Bulto', 152000], ['1/2 Bulto', 77000], ['@', 55000], ['1/2 @', 27500]] },
  { name: 'Mojarra 34', category: 'Acuicultura', brand: 'Italcol', folder: 'ACUICULTURA', variants: [['Bulto', 133000], ['1/2 Bulto', 68000], ['@', 50000], ['1/2 @', 25000]] },
  { name: 'Mojarra 30', category: 'Acuicultura', brand: 'Italcol', folder: 'ACUICULTURA', variants: [['Bulto', 130000], ['1/2 Bulto', 66000], ['@', 49000], ['1/2 @', 24000]] },
  { name: 'Mojarra 24', category: 'Acuicultura', brand: 'Italcol', folder: 'ACUICULTURA', variants: [['Bulto', 113000], ['1/2 Bulto', 58000], ['@', 45000], ['1/2 @', 22500]] },
  { name: 'Mojarra 20', category: 'Acuicultura', brand: 'Italcol', folder: 'ACUICULTURA', variants: [['Bulto', 104000], ['1/2 Bulto', 53000], ['@', 36500], ['1/2 @', 18500]] },

  { name: 'Italovinos Lactancia', category: 'Ovinos', brand: 'Italcol', folder: 'OVINOS', variants: [['Bulto', 72500]] },
  { name: 'Italovinos Crecimiento', category: 'Ovinos', brand: 'Italcol', folder: 'OVINOS', variants: [['Bulto', 63500]] },
  { name: 'Italovinos Cría', category: 'Ovinos', brand: 'Italcol', folder: 'OVINOS', variants: [['Bulto', 80000]] },

  { name: 'Conejos', category: 'Conejos', brand: 'Puente Tierra', folder: 'CONEJOS', variants: [['Bulto', 93000]] },
  { name: 'Conejos Finca', category: 'Conejos', brand: 'Finca', folder: 'CONEJOS', variants: [['Bulto', 96000]] },
  { name: 'Conejo 20Kl PACA', category: 'Conejos', brand: 'Puente Tierra', folder: 'CONEJOS', variants: [['Bulto', 49000]] },

  { name: 'Italsal NF', category: 'Sales', brand: 'Atalsal', folder: 'SALES', variants: [['Bulto', 60000]] },
  { name: 'Pack Fique Italsal', category: 'Sales', brand: 'Atalsal', folder: 'SALES', variants: [['Bulto', 24000]] },
  { name: 'Italsal Fique Ovinos', category: 'Sales', brand: 'Atalsal', folder: 'SALES', variants: [['Bulto', 37000]] },
  { name: 'Italsal Ovinos 20Kl', category: 'Sales', brand: 'Atalsal', folder: 'SALES', variants: [['Bulto', 59000]] },
  { name: 'Tropico 4-15', category: 'Sales', brand: 'Atalsal', folder: 'SALES', variants: [['Bulto', 81000]] },
  { name: 'Tropico 6-15', category: 'Sales', brand: 'Atalsal', folder: 'SALES', variants: [['Bulto', 100000]] },
  { name: 'Tropico 8-15', category: 'Sales', brand: 'Atalsal', folder: 'SALES', variants: [['Bulto', 115000]] },
  { name: 'Lechería 4-18', category: 'Sales', brand: 'Atalsal', folder: 'SALES', variants: [['Bulto', 87000]] },
  { name: 'Lechería 6-18', category: 'Sales', brand: 'Atalsal', folder: 'SALES', variants: [['Bulto', 106000]] },
  { name: 'Lechería 8-18', category: 'Sales', brand: 'Atalsal', folder: 'SALES', variants: [['Bulto', 125000]] },
  { name: 'Lechería 10-18', category: 'Sales', brand: 'Atalsal', folder: 'SALES', variants: [['Bulto', 134000]] },

  { name: 'Filpo Adulto', category: 'Mascotas Finca', brand: 'Finca', folder: 'MASCOTAS FINCA', variants: [['Bulto', 110000]] },
  { name: 'Ringo Cachorros', category: 'Mascotas Finca', brand: 'Finca', folder: 'MASCOTAS FINCA', variants: [['Bulto', 140000], ['1/2 Bulto', 72000]] },
  { name: 'Ringo Croquetas', category: 'Mascotas Finca', brand: 'Finca', folder: 'MASCOTAS FINCA', variants: [['Bulto', 124000], ['1/2 Bulto', 64000]] },
  { name: 'Ringo Premium', category: 'Mascotas Finca', brand: 'Finca', folder: 'MASCOTAS FINCA', variants: [['Bulto', 145000]] },
  { name: 'Mirringo 8Kl', category: 'Mascotas Finca', brand: 'Finca', folder: 'MASCOTAS FINCA', variants: [['Bulto', 67000]] },

  { name: 'Chunky Cachorros 18Kl', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 156000]] },
  { name: 'Chunky Adultos 25Kl', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 164000]] },
  { name: 'Chunky Cachorros 9Kl', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 84000]] },
  { name: 'Chunky Adultos 8Kl RP', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 65000]] },
  { name: 'Chunky Adultos 9Kl', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 71500]] },
  { name: 'Chunky Cordero 8Kl', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 118000]] },
  { name: 'Italcan Wafer 10Kl', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 41000]] },
  { name: 'Italcan Wafer 30Kl', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 110000], ['1/2 Bulto', 56000]] },
  { name: 'Chunky 2Kl', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 27000]] },
  { name: 'Chunky Cordero 12Kl', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 141000]] },
  { name: 'Agility Piel', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 36500]] },
  { name: 'Mirringo 8Kl', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 67000]] },
  { name: 'Tuffy 7Kl', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 63000]] },
  { name: 'Chunky Gatos 18Kl', category: 'Mascotas Italcol', brand: 'Italcol', folder: 'MASCOTAS ITALCOL', variants: [['Bulto', 178000]] },

  { name: 'AG1', category: 'Porcicultura', brand: 'Finca', folder: 'PORCICULTURA FINCA', variants: [['Bulto', 141000]] },
  { name: 'AG2', category: 'Porcicultura', brand: 'Finca', folder: 'PORCICULTURA FINCA', variants: [['Bulto', 112500]] },
  { name: 'F.CERDO LEVANTE', category: 'Porcicultura', brand: 'Finca', folder: 'PORCICULTURA FINCA', variants: [['Bulto', 81000]] },
  { name: 'F.CERDO ENGORDE 065', category: 'Porcicultura', brand: 'Finca', folder: 'PORCICULTURA FINCA', variants: [['Bulto', 75000]] },
  { name: 'F.CERDO FINALIZADOR', category: 'Porcicultura', brand: 'Finca', folder: 'PORCICULTURA FINCA', variants: [['Bulto', 85500]] },
  { name: 'F.CERDA GESTACIÓN', category: 'Porcicultura', brand: 'Finca', folder: 'PORCICULTURA FINCA', variants: [['Bulto', 76000]] },
  { name: 'F.CERDA LACTANCIA', category: 'Porcicultura', brand: 'Finca', folder: 'PORCICULTURA FINCA', variants: [['Bulto', 81500]] },
  { name: 'F.CERDA GESTACIÓN AGP', category: 'Porcicultura', brand: 'Finca', folder: 'PORCICULTURA FINCA', variants: [['Bulto', 83000]] },

  { name: 'F. Pollito BB', category: 'Pollo Engorde', brand: 'Finca', folder: 'POLLO ENGORDE FINCA', variants: [['Bulto', 94000]] },
  { name: 'Pollo Campesino', category: 'Pollo Engorde', brand: 'Finca', folder: 'POLLO ENGORDE FINCA', variants: [['Bulto', 69000]] },
  { name: 'F. Pollito', category: 'Pollo Engorde', brand: 'Finca', folder: 'POLLO ENGORDE FINCA', variants: [['Bulto', 91500]] },

  { name: 'Pollita Pre-iniciadora', category: 'Posturas', brand: 'Italcol', folder: 'POSTURAS', variants: [['Bulto', 91000]] },
  { name: 'Pollita Iniciación', category: 'Posturas', brand: 'Italcol', folder: 'POSTURAS', variants: [['Bulto', 85000]] },
  { name: 'Polla Levante', category: 'Posturas', brand: 'Italcol', folder: 'POSTURAS', variants: [['Bulto', 79000]] },
  { name: 'Prepico 100 QUEB', category: 'Posturas', brand: 'Italcol', folder: 'POSTURAS', variants: [['Bulto', 82000], ['1/2 Bulto', 42000]] },
  { name: 'Codorniz', category: 'Posturas', brand: 'Italcol', folder: 'POSTURAS', variants: [['Bulto', 88000]] },
  { name: 'Prepico Arranque', category: 'Posturas', brand: 'Italcol', folder: 'POSTURAS', variants: [['Bulto', 79000]] },
  { name: 'Prepico HNA', category: 'Posturas', brand: 'Italcol', folder: 'POSTURAS', variants: [['Bulto', 81000], ['1/2 Bulto', 42000]] },

  { name: 'Don Kat 7 Kl', category: 'Gatos', brand: 'Italcol', folder: 'GATOS', variants: [['Bulto', 74000]] },
  { name: 'Don Kat 16 Kl', category: 'Gatos', brand: 'Italcol', folder: 'GATOS', variants: [['Bulto', 145000]] },
  { name: 'Q-ida Cat', category: 'Gatos', brand: 'Italcol', folder: 'GATOS', variants: [['Bulto', 69000]] },

  { name: '10-30-10 50Kl', category: 'Abonos', brand: 'Yara', folder: 'ABONOS', variants: [['Bulto', 165000]] },
  { name: 'Radio Menores', category: 'Abonos', brand: 'Yara', folder: 'ABONOS', variants: [['Bulto', 127000]] },
  { name: 'Remital', category: 'Abonos', brand: 'Yara', folder: 'ABONOS', variants: [['Bulto', 124000]] },
  { name: 'Aboteck', category: 'Abonos', brand: 'Yara', folder: 'ABONOS', variants: [['Bulto', 132000]] },
  { name: 'Triple 15', category: 'Abonos', brand: 'Yara', folder: 'ABONOS', variants: [['Bulto', 130000]] },
  { name: 'Urea', category: 'Abonos', brand: 'Yara', folder: 'ABONOS', variants: [['Bulto', 110000]] },
  { name: '10-20-20 Kabal', category: 'Abonos', brand: 'Yara', folder: 'ABONOS', variants: [['Bulto', 155000]] },
  { name: 'Amina', category: 'Abonos', brand: 'Yara', folder: 'ABONOS', variants: [['Bulto', 31000]] },

  { name: 'Ratón', category: 'Venenos', brand: 'Puente Tierra', folder: 'VENENOS', variants: [['Bulto', 600]] },
  { name: 'Gramoxone Paraquat', category: 'Venenos', brand: 'Puente Tierra', folder: 'VENENOS', variants: [['Bulto', 18000]] },
  { name: 'Glifosato', category: 'Venenos', brand: 'Puente Tierra', folder: 'VENENOS', variants: [['Bulto', 19000]] },
  { name: 'Randan 10 Lt', category: 'Venenos', brand: 'Puente Tierra', folder: 'VENENOS', variants: [['Bulto', 330000]] },
  { name: 'Glifosato 50 Gr', category: 'Venenos', brand: 'Puente Tierra', folder: 'VENENOS', variants: [['Bulto', 4500]] },
  { name: 'Glifosato Kl', category: 'Venenos', brand: 'Puente Tierra', folder: 'VENENOS', variants: [['Bulto', 36000]] },
  { name: 'Cipermetrina 250 Mlt', category: 'Venenos', brand: 'Puente Tierra', folder: 'VENENOS', variants: [['Bulto', 12000]] },
  { name: 'Cipermetrina Lt', category: 'Venenos', brand: 'Puente Tierra', folder: 'VENENOS', variants: [['Bulto', 28000]] },

  { name: 'Maíz Partido', category: 'Maiz y Materias Primas', brand: 'Puente Tierra', folder: 'MAÍZ Y MATERIAS PRIMAS', variants: [['Bulto', 81000]] },
  { name: 'Repila Maíz Amarillo', category: 'Maiz y Materias Primas', brand: 'Puente Tierra', folder: 'MAÍZ Y MATERIAS PRIMAS', variants: [['Bulto', 56000]] },
  { name: 'H3', category: 'Maiz y Materias Primas', brand: 'Puente Tierra', folder: 'MAÍZ Y MATERIAS PRIMAS', variants: [['Bulto', 55000]] },
  { name: 'Carbonato de Calcio', category: 'Maiz y Materias Primas', brand: 'Puente Tierra', folder: 'MAÍZ Y MATERIAS PRIMAS', variants: [['Bulto', 17000]] },
  { name: 'Maíz Molido 40Kg', category: 'Maiz y Materias Primas', brand: 'Puente Tierra', folder: 'MAÍZ Y MATERIAS PRIMAS', variants: [['Bulto', 60000]] },

  { name: 'Arnero Pequeño', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 14000]] },
  { name: 'Arnero Mediano', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 20000]] },
  { name: 'Arnero Grande', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 31000]] },
  { name: 'Plástico Negro', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 5000]] },
  { name: 'Manguera 1/2" C 40', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 55000]] },
  { name: 'Manguera 1/2" C 60', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 93000]] },
  { name: 'Manguera 3/4" C 40', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 85000]] },
  { name: 'Manguera 3/4" C 60', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 125000]] },
  { name: 'Manguera 1" C 40', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 112000]] },
  { name: 'Manguera 1" C 60', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 200000]] },
  { name: 'Palos Pala - Pica', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 7000]] },
  { name: 'Palos Azadón - Hacha', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 8000]] },
  { name: 'Palos Paladraga', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 20000]] },
  { name: 'Cincel', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 15000]] },
  { name: 'Gancho Comedero', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 1400]] },
  { name: 'Cerbo', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 3800]] },
  { name: 'Brida', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 7000]] },
  { name: 'Manguera Bebedero', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 1000]] },
  { name: 'Carbón Kl', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 2600]] },
  { name: 'Sal Toro', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 18000]] },
  { name: 'Sal la Y', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 20000]] },
  { name: 'Abrazadera 5/16"', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 1700]] },
  { name: 'Abrazadera 1 1/8"', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 2500]] },
  { name: 'Abrazadera 1 1/2"', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 3200]] },
  { name: 'Abrazadera 2"', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 3200]] },
  { name: 'Abrazadera 2 1/4"', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 3400]] },
  { name: 'Abrazadera 2 1/2"', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 3700]] },
  { name: 'Abrazadera 3"', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Unidad', 4000]] },
  { name: 'Cemento (Bulto)', category: 'Ferreteria', brand: 'Puente Tierra', folder: 'FERRETERÍA', variants: [['Bulto', 31500]] }
];

const plainProducts = ensureUniqueIds(productDefinitions.flatMap(createVariantProducts));
const typedItems = plainProducts.map(toDynamoItem);
const batchWritePayload = {
  RequestItems: {
    Productos: typedItems.map(item => ({
      PutRequest: {
        Item: item
      }
    }))
  }
};

fs.writeFileSync(path.resolve(docsDir, 'productos-dynamodb-base.json'), JSON.stringify(plainProducts, null, 2));
fs.writeFileSync(path.resolve(docsDir, 'productos-dynamodb-items.json'), JSON.stringify(typedItems, null, 2));
fs.writeFileSync(path.resolve(docsDir, 'productos-dynamodb-batchwrite.json'), JSON.stringify(batchWritePayload, null, 2));

console.log(`Productos base generados: ${plainProducts.length}`);
console.log('Archivos actualizados:');
console.log('- docs/productos-dynamodb-base.json');
console.log('- docs/productos-dynamodb-items.json');
console.log('- docs/productos-dynamodb-batchwrite.json');
