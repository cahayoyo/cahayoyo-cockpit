import { pick, randomInt } from './random';

// Static Indonesian name lists (decision 14): 40 first + 40 last names,
// combined randomly and gender-neutral.
const FIRST_NAMES = [
	'Adi',
	'Agung',
	'Andi',
	'Anugrah',
	'Ardi',
	'Arief',
	'Bagas',
	'Bayu',
	'Bima',
	'Cahaya',
	'Cahyo',
	'Candra',
	'Damar',
	'Deni',
	'Dimas',
	'Dwi',
	'Eka',
	'Elang',
	'Fajar',
	'Farid',
	'Galih',
	'Galuh',
	'Hadi',
	'Haris',
	'Ilham',
	'Indra',
	'Iwan',
	'Jaka',
	'Kurnia',
	'Lukman',
	'Luthfi',
	'Nur',
	'Putra',
	'Rahmat',
	'Raka',
	'Rangga',
	'Reza',
	'Rizky',
	'Satria',
	'Taufik'
] as const;

const LAST_NAMES = [
	'Abdullah',
	'Arifin',
	'Firmansyah',
	'Gunawan',
	'Hakim',
	'Halim',
	'Hartono',
	'Hidayat',
	'Hutagalung',
	'Hutapea',
	'Irawan',
	'Kurniawan',
	'Kusuma',
	'Lubis',
	'Manurung',
	'Maulana',
	'Nainggolan',
	'Nasution',
	'Nugraha',
	'Panjaitan',
	'Permana',
	'Pratama',
	'Purnama',
	'Rahman',
	'Ramadhan',
	'Santoso',
	'Saputra',
	'Setiawan',
	'Sihombing',
	'Simanjuntak',
	'Simatupang',
	'Siregar',
	'Sitorus',
	'Suryana',
	'Susanto',
	'Utomo',
	'Wibowo',
	'Wijaya',
	'Wijayanti',
	'Zulkarnain'
] as const;

const STREETS = [
	'Jl. Merdeka',
	'Jl. Sudirman',
	'Jl. Thamrin',
	'Jl. Gatot Subroto',
	'Jl. Diponegoro',
	'Jl. Ahmad Yani',
	'Jl. Pahlawan',
	'Jl. Melati',
	'Jl. Mawar',
	'Jl. Kenanga',
	'Jl. Cendrawasih',
	'Jl. Mangga Besar',
	'Jl. Kebon Jeruk',
	'Jl. Pemuda',
	'Jl. Kartini',
	'Jl. Gajah Mada',
	'Jl. Hayam Wuruk',
	'Jl. Cikini Raya',
	'Jl. Asia Afrika',
	'Jl. Ahmad Dahlan'
] as const;

const CITIES = [
	{ city: 'Jakarta Pusat', postal: '10110', provinceCode: '31' },
	{ city: 'Bandung', postal: '40111', provinceCode: '32' },
	{ city: 'Semarang', postal: '50132', provinceCode: '33' },
	{ city: 'Yogyakarta', postal: '55111', provinceCode: '34' },
	{ city: 'Surabaya', postal: '60111', provinceCode: '35' },
	{ city: 'Tangerang', postal: '15111', provinceCode: '36' },
	{ city: 'Denpasar', postal: '80111', provinceCode: '51' },
	{ city: 'Medan', postal: '20111', provinceCode: '12' },
	{ city: 'Palembang', postal: '30111', provinceCode: '16' },
	{ city: 'Makassar', postal: '90111', provinceCode: '73' },
	{ city: 'Balikpapan', postal: '76111', provinceCode: '64' },
	{ city: 'Pontianak', postal: '78111', provinceCode: '61' }
] as const;

const EMAIL_DOMAINS = ['example.com', 'mail.test', 'inbox.test'] as const;

export type TestRecord = {
	name: string;
	email: string;
	phone: string;
	nik: string;
	address: string;
};

export type TestDataField = keyof TestRecord;

export const TEST_DATA_FIELDS: TestDataField[] = ['name', 'email', 'phone', 'nik', 'address'];

function randomIntInclusive(min: number, max: number): number {
	return min + randomInt(max - min + 1);
}

function pad(value: number, size: number): string {
	return String(value).padStart(size, '0');
}

function randomBirthDate(): Date {
	return new Date(
		randomIntInclusive(1970, 2005),
		randomIntInclusive(0, 11),
		randomIntInclusive(1, 28)
	);
}

export function generateName(): string {
	return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

export function generateEmail(name?: string): string {
	const base = (name ?? generateName())
		.toLowerCase()
		.replace(/[^a-z0-9 ]/g, '')
		.trim()
		.replace(/\s+/g, '.');
	return `${base}${randomIntInclusive(1, 99)}@${pick(EMAIL_DOMAINS)}`;
}

export function generatePhone(): string {
	const subscriber = `8${randomIntInclusive(11, 99)}${pad(randomInt(100_000_000), 8)}`;
	return `+62${subscriber}`;
}

export function generateNik(birth = randomBirthDate()): string {
	const { provinceCode } = pick(CITIES);
	const city = pad(randomIntInclusive(1, 99), 2);
	const district = pad(randomIntInclusive(1, 99), 2);
	const date = `${pad(birth.getDate(), 2)}${pad(birth.getMonth() + 1, 2)}${pad(birth.getFullYear() % 100, 2)}`;
	const sequence = pad(randomIntInclusive(1, 9999), 4);
	return `${provinceCode}${city}${district}${date}${sequence}`;
}

export function generateAddress(): string {
	const { city, postal } = pick(CITIES);
	const street = pick(STREETS);
	const number = randomIntInclusive(1, 250);
	const rt = pad(randomIntInclusive(1, 20), 2);
	const rw = pad(randomIntInclusive(1, 20), 2);
	return `${street} No. ${number}, RT ${rt}/RW ${rw}, ${city} ${postal}`;
}

export function generateRecord(): TestRecord {
	const name = generateName();
	return {
		name,
		email: generateEmail(name),
		phone: generatePhone(),
		nik: generateNik(),
		address: generateAddress()
	};
}

export function generateTestData(field: TestDataField, count: number): string[] {
	const size = Math.min(Math.max(Math.trunc(Number(count)) || 1, 1), 10);
	return Array.from({ length: size }, () => generateRecord()[field]);
}
