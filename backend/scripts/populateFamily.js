/**
 * BN Family Tree Population Script
 * Uses Mongoose directly to insert all members and wire relationships.
 * Run from project root: node backend/scripts/populateFamily.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Member = require('../models/Member');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/familytree';

// ─── Date helper DD/MM/YYYY → YYYY-MM-DD ──────────────────────────────────────
function d(str) {
  if (!str) return undefined;
  const parts = str.split('/');
  if (parts.length !== 3) return str;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function det(obj = {}) {
  const out = {};
  if (obj.dob)           out.dob           = d(obj.dob);
  if (obj.marriageDate)  out.marriageDate   = d(obj.marriageDate);
  if (obj.dateOfDeath)   out.dateOfDeath    = d(obj.dateOfDeath);
  if (obj.phone)         out.phone          = obj.phone;
  if (obj.email)         out.email          = obj.email;
  if (obj.address)       out.address        = obj.address;
  if (obj.qualification) out.qualification  = obj.qualification;
  if (obj.profession)    out.profession     = obj.profession;
  return out;
}

// ─── Members definition ───────────────────────────────────────────────────────
const MEMBERS = [
  // ── Generation 1 ──
  { label: 'G1_1', name: 'Prahlad Mishra', nickname: 'Baba', gender: 'Male',
    details: det({ dob:'24/06/1914', marriageDate:'25/05/1940', dateOfDeath:'07/10/2006',
      address:'Pandit Prahlad Mishra, At- Madhyakhandi, P.O. Sri-Baldevjew, Dist- Kendrapara, 754212',
      qualification:'Sahityacharya' }) },

  { label: 'G1_2', name: 'Basanta Devi', nickname: 'Maa', gender: 'Female',
    details: det({ dob:'10/07/1926', marriageDate:'25/05/1940', dateOfDeath:'23/12/2016' }) },

  // ── Generation 2 ──
  { label: 'G2_1', name: 'Prafulla Kumar Mishra', nickname: 'Prafulla', gender: 'Male',
    details: det({ dob:'25/10/1942', marriageDate:'17/01/1966', phone:'82701 27320',
      address:'Prafulla Kumar Mishra, Plot # 3775/8248, Prachi Vihar, Palasuni, Bhubaneswar - 751025',
      qualification:'Diplo Civil Engg', profession:'Retired Asst Director' }) },

  { label: 'G2_2', name: 'Anasuya Kar', nickname: 'Anu', gender: 'Female',
    details: det({ dob:'27/03/1952', marriageDate:'17/01/1966', phone:'98615 90658',
      address:'C/O Prafulla Kumar Mishra, Plot # 3775/8248, Prachi Vihar, Palasuni, Bhubaneswar - 751025',
      qualification:'ME', profession:'Housewife' }) },

  { label: 'G2_3', name: 'Shanta Devi', nickname: 'Tuni', gender: 'Female',
    details: det({ dob:'29/10/1949', phone:'86587 49119', email:'santamishra532@gmail.com',
      address:'At- Chatra Sasan, P.O. Gopaljewpatna, Kendrapara, 754250',
      qualification:'Class-V', profession:'Housewife' }) },

  { label: 'G2_4', name: 'Damodar Mishra', nickname: 'Dama', gender: 'Male',
    details: det({ dob:'21/11/1937',
      address:'At- Chatra Sasan, P.O. Gopaljewpatna, Kendrapara, 754250',
      qualification:'M.A.[Odia] M.Phil.', profession:'Retired Professor [Odia]' }) },

  { label: 'G2_5', name: 'Pradipta Kumar Mishra', nickname: 'Dipti', gender: 'Male',
    details: det({ dob:'31/05/1952', marriageDate:'13/06/1981', phone:'94347 191490',
      email:'pkmishra1952@gmail.com',
      address:'A-6. Durgapur Park, CC-09, Newtown, Kolkata-700156',
      qualification:'B.Sc.[Engg] Mech Hons', profession:'Retired MD, NINL / ED SAIL' }) },

  { label: 'G2_6', name: 'Deeptimoyee', nickname: 'Jolley', gender: 'Female',
    details: det({ dob:'14/07/1957', marriageDate:'13/06/1981', phone:'79786 15030',
      email:'deepti140759@gmail.com',
      address:'A-6. Durgapur Park, CC-09, Newtown, Kolkata-700156',
      qualification:'M.Sc[Socio], LLB', profession:'Advocate' }) },

  { label: 'G2_7', name: 'Mahasweta Mishra', nickname: 'Khusi', gender: 'Female',
    details: det({ dob:'17/10/1954', marriageDate:'02/03/1972', phone:'9439834904',
      address:'Mahasweta Mishra, Fatenagar, Junagarh, Kalahandi, Odisha- 766014',
      qualification:'ACHARYA', profession:'Retired School Teacher' }) },

  { label: 'G2_8', name: 'Purusottam Kar', nickname: 'Babuli', gender: 'Male',
    details: det({ dob:'25/12/1949', marriageDate:'02/03/1972', phone:'73259 40022',
      address:'Fatenagar, Junagarh, Kalahandi, Odisha- 766014',
      qualification:'B.Sc.', profession:'NIL' }) },

  { label: 'G2_9', name: 'Prashanta Kumar Mishra', nickname: 'Prashanta', gender: 'Male',
    details: det({ marriageDate:'29/05/1985', phone:'88955 85537',
      qualification:'MA(PSYCH) LLB' }) },

  { label: 'G2_10', name: 'Aditi Mishra', nickname: 'Nami', gender: 'Female',
    details: det({ dob:'23/06/1970', marriageDate:'29/05/1985', phone:'98614 44720',
      email:'aditi.nami70@gmail.com', qualification:'Class-X', profession:'Housewife' }) },

  { label: 'G2_11', name: 'Unknown', nickname: 'Wife#2', gender: 'Female', details: {} },

  { label: 'G2_12', name: 'Pradyumna Kumar Mishra', nickname: 'Baboo', gender: 'Male',
    details: det({ dob:'02/03/1962', marriageDate:'18/05/1987', phone:'993949347',
      email:'pkmishra@gmail.com',
      address:'Pradyumna Kr Mishra, At- Biraswati, Near Ma Kharakhai Temple, P.O. Sri-Baldevjew, Kendrapara, 754212',
      qualification:'MA(PSYCH) LLB' }) },

  { label: 'G2_13', name: 'Pushpa Kar', nickname: 'Sumi', gender: 'Female',
    details: det({ dob:'09/04/1965', marriageDate:'18/05/1987', phone:'9776364301',
      email:'Pushapanjalikar4.03@gmail.com',
      address:'Pradyumna Kr Mishra, At- Biraswati, Near Ma Kharakhai Temple, P.O. Sri-Baldevjew, Kendrapara, 754212',
      qualification:'H.S.CT', profession:'Teacher' }) },

  { label: 'G2_14', name: 'Prabodh Kumar Mishra', nickname: 'Tuku', gender: 'Male',
    details: det({ address:'Madhyakhandi, Sri-Baldebjew, Kendrapara - 754212, Odisha' }) },

  { label: 'G2_15', name: 'Unknown', nickname: 'Wife of Tuku', gender: 'Female', details: {} },

  // ── Generation 3 — Branch 1 (Prafulla & Anasuya) ──
  { label: 'G3_1', name: 'Prativa Mishra', nickname: 'Kuni', gender: 'Female',
    details: det({ dob:'16/08/1968', marriageDate:'10/06/1995', phone:'93376 77082',
      email:'prativamishra303@gmail.com',
      address:'C/O Satyabrata Acharya, At- Khariamada, P.O. Banamalipur, Via - Badamba, Dist- Cuttack, 754031',
      qualification:'MA[Sanskrit]', profession:'Teacher' }) },

  { label: 'G3_2', name: 'Satyabrata Acharya', nickname: 'Satya', gender: 'Male',
    details: det({ dob:'25/04/1961', marriageDate:'10/06/1995', dateOfDeath:'02/10/2020',
      qualification:'MA (Pol Sc)[HISTORY][PUB ADMN]', profession:'Reader, Kanpur College' }) },

  { label: 'G3_3', name: 'Pravati Mishra', nickname: 'Minu', gender: 'Female',
    details: det({ dob:'11/10/1969', marriageDate:'11/06/1998', phone:'70648 19395',
      address:'C/O Amit Kr Sarangi, House # L-II-116, Kalinga Vihar, Phase-II, Chhend, Rourkela -769015',
      qualification:'MA [Odia]', profession:'Housewife' }) },

  { label: 'G3_4', name: 'Amit Sarangi', nickname: 'Amit', gender: 'Male',
    details: det({ dob:'25/03/1967', marriageDate:'11/06/1998', phone:'9771482918',
      email:'mailmesarangi@gmail.com',
      address:'Amit Kr Sarangi, House # L-II-116, Kalinga Vihar, Phase-II, Chhend, Rourkela -769015',
      qualification:'M.Sc.', profession:'Asst Operations Manager, Railways' }) },

  { label: 'G3_5', name: 'Pranati Mishra', nickname: 'Jhunu', gender: 'Female',
    details: det({ dob:'17/10/1971', marriageDate:'10/12/2005', phone:'91141 37678',
      email:'pranatijhunu71@gmail.com',
      address:'C/O Prafulla Kumar Mishra, Plot # 3775/8248, Prachi Vihar, Palasuni, Bhubaneswar - 751025',
      qualification:'MA[Odia], PGDCA, PGDIT', profession:'No Engagement' }) },

  { label: 'G3_6', name: 'Pradyot Mishra', nickname: 'Sibu', gender: 'Male',
    details: det({ dob:'01/06/1975', phone:'63706 89932',
      address:'C/O Prafulla Kumar Mishra, Plot # 3775/8248, Prachi Vihar, Palasuni, Bhubaneswar - 751025',
      qualification:'MA[Odia] PGDCA', profession:'No Engagement' }) },

  // ── Generation 3 — Branch 2 (Shanta & Damodar) ──
  { label: 'G3_7', name: 'Kalyani', nickname: 'Kai', gender: 'Female',
    details: det({ dob:'18/06/1965', marriageDate:'05/07/1988', phone:'93375 79787',
      address:'DR Patnaik Colony, Baneikala, Joda, Keonjhar, Odisha, 758038',
      qualification:'BA B.Ed', profession:'Teacher' }) },

  { label: 'G3_8', name: 'Ashok Satpathy', nickname: 'Pagal', gender: 'Male',
    details: det({ dob:'13/10/1959', marriageDate:'05/07/1988', phone:'94377 12380',
      address:'C/O Ashok Satpathy, DR Patnaik Colony, Baneikala, Joda, Keonjhar, Odisha, 758038',
      qualification:'Bcom', profession:'Office Assistant' }) },

  { label: 'G3_9', name: 'Bidhu Bhusan Mishra', nickname: 'Bidhu', gender: 'Male',
    details: det({ dob:'06/09/1966', marriageDate:'07/05/1999', phone:'90788 88859',
      address:'334, Lingaraj nagar, Old Town, Bhubaneswar - 751002',
      qualification:'BA.LLB.Diplo Automobile', profession:'Business' }) },

  { label: 'G3_10', name: 'Chandana', nickname: 'Hira', gender: 'Female',
    details: det({ dob:'16/12/1970', marriageDate:'07/05/1999', phone:'81444 83668',
      qualification:'BA. Bed.', profession:'Primary Teacher' }) },

  { label: 'G3_11', name: 'Niladri Bhusan Mishra', nickname: 'Nilu', gender: 'Male',
    details: det({ dob:'04/03/1970', marriageDate:'08/06/2003', phone:'90044 33645',
      email:'niladrimishra@rediffmail.com',
      address:'B1/601, Shivnath Sky City, Padle Gaon, Kalyan Shil Road, Thane - 421204',
      qualification:'B.Com. C.A[Inter] LLB', profession:'Asst VP, Reliance' }) },

  { label: 'G3_12', name: 'Rosalin Satpathy', nickname: 'Rosy', gender: 'Female',
    details: det({ dob:'15/05/1977', marriageDate:'08/06/2003', phone:'70213 16875',
      email:'rosalinesatpathy@gmail.com',
      address:'B1/601, Shivnath Sky City, Padle Gaon, Kalyan Shil Road, Thane - 421204',
      qualification:'BA', profession:'Housewife' }) },

  { label: 'G3_13', name: 'Anita Mishra', nickname: 'Chunu', gender: 'Female',
    details: det({ dob:'28/05/1974', marriageDate:'23/02/1991', phone:'98539 39310',
      email:'anitamishra@gmail.com',
      address:'AT- DHUMAT SASAN, INDUPUR, NIKIRAI, KENDRAPARA-754214',
      qualification:'PG', profession:'B.C. OGB' }) },

  { label: 'G3_14', name: 'Kashinath Mohapatra', nickname: 'Kashinath', gender: 'Male',
    details: det({ dob:'30/10/1964', marriageDate:'23/02/1991', phone:'7504133434',
      qualification:'Sr Electrician', profession:'Sr Electrician, Emami Paper Mills, Balasore' }) },

  { label: 'G3_15', name: 'Bed Bhusan Mishra', nickname: 'Jitu', gender: 'Male',
    details: det({ dob:'06/07/1975', marriageDate:'21/02/2007', phone:'94392 74805',
      email:'bedabhusanmishra@gmail.com',
      address:'At- Chatra Sasan, P.O. Gopaljewpatna, Kendrapara, 754250',
      qualification:'MA[Odia]', profession:'Self Employed' }) },

  { label: 'G3_16', name: 'Jayaprada Mishra', nickname: 'Chumuki', gender: 'Female',
    details: det({ dob:'07/09/1983', marriageDate:'21/02/2007',
      qualification:'BA CT', profession:'Primary Teacher' }) },

  { label: 'G3_17', name: 'Namita Mishra', nickname: 'Runa', gender: 'Female',
    details: det({ dob:'25/06/1979', marriageDate:'12/07/2005', phone:'99684 03202',
      email:'namita.indian@gmail.com',
      address:'C-83, S-I, Second Floor, DLF Dilshad Extn. - II, Shahibabad Gaziabad, UP- 201005',
      qualification:'M.Com. MBA, PhD',
      profession:'Associate Professor, Tecnia Inst. Of Advance Studies' }) },

  { label: 'G3_18', name: 'Suryakanta Mishra', nickname: 'Mitan', gender: 'Male',
    details: det({ dob:'16/12/1967', marriageDate:'12/07/2005', phone:'99684 49381',
      email:'mishrakhandasahi@gmail.com',
      qualification:'MA[Economics], MBA', profession:'PS to MP' }) },

  { label: 'G3_19', name: 'Sujata Mishra', nickname: 'Jhuna', gender: 'Female',
    details: det({ dob:'21/02/1979', phone:'98354 46632',
      email:'jhuna80@gmail.com',
      address:'Sujata Mishra, SSLLNTM Mahavidyalaya, Luby Circular Road, Dhanbad, Jharkhand, 826001',
      qualification:'MA (Educ)(Eng); M.Phil(Edu)',
      profession:'Asst Professor, Education, SSLNT Mahila Maha Vidyalaya, Dhanbad' }) },

  { label: 'G3_20', name: 'Binita Mishra', nickname: 'Jina', gender: 'Female',
    details: det({ dob:'20/12/1980', marriageDate:'29/02/2008', phone:'97781 44901',
      email:'binita.jina@gmail.com',
      address:'C/O Smruti Ranjan Panda, Flat # 003, Parijat Enclave, Old Town, Bhubaneswar - 2, Khurda, 751002',
      qualification:'MA[Odia]', profession:'Housewife' }) },

  { label: 'G3_21', name: 'Smruti Ranjan Panda', nickname: 'Tuna', gender: 'Male',
    details: det({ dob:'21/01/1975', marriageDate:'29/02/2008', phone:'94371 10979',
      email:'saralatuna@gmail.com',
      qualification:'B.Com/M.Com. CA(Inter)', profession:'Business' }) },

  // ── Generation 3 — Branch 3 (Pradipta & Deeptimoyee) ──
  { label: 'G3_22', name: 'Prachishree Mishra', nickname: 'Luzoo', gender: 'Female',
    details: det({ dob:'14/04/1982', marriageDate:'08/05/2008', phone:'94378 85255',
      email:'luzoopr@gmail.com',
      address:'C/O B K Panigrahi, 2nd Lane, Ramnagar, Kamapalli, Near Ganjam Club, Brahmapur - 760004, Ganjam, Odisha',
      qualification:'MD[G&O]', profession:'Asst Professor, MKCG Medical College' }) },

  { label: 'G3_23', name: 'Hemanta Panigrahi', nickname: 'Hemanta', gender: 'Male',
    details: det({ dob:'22/12/1975' }) },

  { label: 'G3_24', name: 'Mrinaya Mishra', nickname: 'Misha', gender: 'Female',
    details: det({ dob:'18/05/1991', phone:'80068 87274', email:'misha1805@gmail.com',
      qualification:'B.Sc.LLB', profession:'WBJS-2021' }) },

  { label: 'G3_25', name: 'Prayash', nickname: 'Prayash', gender: 'Male', details: {} },

  // ── Generation 3 — Branch 4 (Mahasweta & Purusottam) ──
  { label: 'G3_26', name: 'Purnendu Kr Kar', nickname: 'Dipu', gender: 'Male',
    details: det({ dob:'30/01/1973', marriageDate:'14/02/2005', phone:'94234 16288',
      email:'karsplaw@gmail.com',
      address:'Purnendu Kr Kar, F-3, First Floor, C-Wing, Aravali Apartment, Biyani Nagar, Tukum, Chandrapur, Maharashtra, 442401',
      qualification:'MA, Ph.D', profession:'Professor' }) },

  { label: 'G3_27', name: 'Swagtika Hota', nickname: 'Rosy', gender: 'Female',
    details: det({ dob:'22/10/1978', marriageDate:'14/02/2005', phone:'94229 99853',
      email:'hota.swagatika@gmail.com',
      qualification:'M.Sc. M.Phil.', profession:'Lecturer' }) },

  { label: 'G3_28', name: 'Nabendu Kr Kar', nickname: 'Pupu', gender: 'Male',
    details: det({ dob:'01/01/1975', marriageDate:'16/01/2011', phone:'79786 72537',
      email:'nkkar2011@gmail.com',
      address:'Nabendu Kar, Near JIO Office, A.B.college Road, Basudevpur, Bhadrak, Odisha 756125',
      qualification:'MA, MBA', profession:'Nil' }) },

  { label: 'G3_29', name: 'Tapswini Rath', nickname: 'Ranu', gender: 'Female',
    details: det({ dob:'08/01/1982', marriageDate:'16/01/2011', phone:'94386 25073',
      email:'tapaswinirath4640@gmail.com',
      address:'Tapaswani Rath, Lecturer in Philosophy, A.B.College, Basudevpur, Bhadrak, Odisha- 756125',
      qualification:'MA. M.Phil', profession:'Lecturer' }) },

  { label: 'G3_30', name: 'Suvendu Kr Kar', nickname: 'Tapu', gender: 'Male',
    details: det({ dob:'21/06/1977', marriageDate:'10/07/2012', phone:'95608 90337',
      email:'skarenv@gmail.cm',
      address:'Suvendu Kr Kar, C-506, POWERGRID TOWNSHIP, Sector - 43, Gurgaon - 122002, Haryana',
      qualification:'M.Sc., M.Phil', profession:'Manager, Powergrid' }) },

  { label: 'G3_31', name: 'Archana Mishra', nickname: 'Rinee', gender: 'Female',
    details: det({ dob:'08/10/1988', marriageDate:'10/07/2012', phone:'83689 71761',
      email:'archanamishra2021@rediffmail.com',
      qualification:'BA', profession:'Housewife' }) },

  // ── Generation 3 — Branch 5 (Prashanta's children) ──
  { label: 'G3_32', name: 'Prasheet Mishra', nickname: 'Bablu', gender: 'Male',
    details: det({ dob:'04/05/1986', marriageDate:'02/03/2025', phone:'94374 16992',
      email:'prasheetmishra@gmail.com',
      address:'Prasheet Mishra, Flat #201, 2nd Floor, Faculty Residence, Ramachandrapur, Jatni, Centurion University of Technology & Management, 752050',
      qualification:'Ph D Continuing-2021', profession:'Asst Prof, CV Raman' }) },

  { label: 'G3_33', name: 'Priyanka', nickname: 'Priyanka', gender: 'Female',
    details: det({ marriageDate:'02/03/2025' }) },

  { label: 'G3_34', name: 'Pratyakshya Mishra', nickname: 'Jubli', gender: 'Female',
    details: det({ dob:'27/12/1988', marriageDate:'08/02/2015', phone:'88478 01686',
      email:'pratyakshyamishra@gmail.com',
      address:'Pratyakshya Mishra, PLOT# 1818/4218, SRIRAM NAGAR, Lane#4, Old Town, Bhubaneswar - 751002',
      qualification:'MA[Econ] UU', profession:'Housewife' }) },

  { label: 'G3_35', name: 'Rakesh Satpathy', nickname: 'Silu', gender: 'Male',
    details: det({ dob:'09/06/1989' }) },

  { label: 'G3_36', name: 'Prabhasankar Mishra', nickname: 'Dablu', gender: 'Male',
    details: det({ dob:'03/07/1988', phone:'93372 80012', email:'prabhasankarmishra@gmail.com',
      qualification:'B Sc(Zoology)', profession:'Student-2021' }) },

  { label: 'G3_37', name: 'Unknown', nickname: 'Son (b)', gender: 'Male', details: {} },
  { label: 'G3_38', name: 'Unknown', nickname: 'Daughter (b)', gender: 'Female', details: {} },

  // ── Generation 3 — Branch 6 (Pradyumna's children) ──
  { label: 'G3_39', name: 'Pradosh Mishra', nickname: 'Mantu', gender: 'Male',
    details: det({ dob:'02/07/1988', marriageDate:'02/12/2020', phone:'9583461211',
      email:'Pradoshkdp@gmail.com',
      qualification:'M.Com/M.Phil/B.Ed', profession:'Teacher' }) },

  { label: 'G3_40', name: 'Tejasmita Suar', nickname: 'Mama', gender: 'Female',
    details: det({ dob:'03/03/1995', marriageDate:'02/12/2020', phone:'9668524833',
      email:'tejasmitasuar95@gmail.com',
      qualification:'BA DIPL IN EDU' }) },

  { label: 'G3_41', name: 'Pranay Mishra', nickname: 'Pintu', gender: 'Male',
    details: det({ dob:'30/10/1989', marriageDate:'02/12/2020', phone:'9833587544',
      email:'Pranayaiias@gmail.com',
      address:'MIG 2/301, Lane # 7, Satyasahi Enclave, Kolthia, Khandagiri, Near AMRI Hospital, Bhubaneswar - 751030',
      qualification:'I.Sc. Dipl Aeronautical Science', profession:'Engineer, Indigo Airlines' }) },

  { label: 'G3_42', name: 'Prajnasmita Mishra', nickname: 'Luin', gender: 'Female',
    details: det({ dob:'09/09/1989', marriageDate:'02/12/2020', phone:'7504888718',
      email:'Prajnasmitamishra@gmail.com',
      qualification:'M.Sc.B.Ed.' }) },

  // ── Generation 3 — Branch 7 (Prabodh's children) ──
  { label: 'G3_43', name: 'Unknown', nickname: 'Son of Tuku', gender: 'Male', details: {} },
  { label: 'G3_44', name: 'Unknown', nickname: 'Daughter of Tuku', gender: 'Female', details: {} },

  // ── Generation 4 ──
  { label: 'G4_1', name: 'Subhasmita Acharya', nickname: 'Manika', gender: 'Female',
    details: det({ dob:'19/12/1997', marriageDate:'29/01/2020', phone:'79780 03499',
      email:'suvasmitaacharya01@gmail.com',
      address:'Suvasmita Acharya, C/O Satyabrata Acharya, At- Khariamada, P.O. Banamalipur, Via - Badamba, Dist- Cuttack, 754031',
      qualification:'B.Tech (Electronics)', profession:'Housewife' }) },

  { label: 'G4_2', name: 'Pradyumna Panda', nickname: 'Pappu', gender: 'Male',
    details: det({ dob:'09/06/1992', marriageDate:'29/01/2020', phone:'81180 50463',
      qualification:'B.Tech. [ELECT]', profession:'Indian Army, Tech Asst.' }) },

  { label: 'G4_3', name: 'Aparamita Sarangi', nickname: 'Appu', gender: 'Female',
    details: det({ dob:'05/04/2000', phone:'6370557406', email:'aparmitasarangi@gmail.com',
      address:'Building # 534, 91st Cross Road, 1st Stage, Kumarswamy Layout, Bengaluru - 560078',
      qualification:'BDS 2nd Year [2021]', profession:'Student-2021' }) },

  { label: 'G4_4', name: 'Anshuman Sarangi', nickname: 'Gugun', gender: 'Male',
    details: det({ dob:'15/08/2006', phone:'7077010179', email:'ansumansarangi38@gmail.com',
      address:'C/O Amit Kr Sarangi, House # L-II-116, Kalinga Vihar, Phase-II, Chhend, Rourkela -769015',
      qualification:'CL-X [2021]', profession:'Student-2021' }) },

  { label: 'G4_5', name: 'Ipsita Satpathy', nickname: 'Ipu', gender: 'Female',
    details: det({ dob:'10/11/1989', marriageDate:'02/07/2014', phone:'91258 30343',
      address:'C/O Soumitri Mishra, House # 343, Type-III, IIT Kanpur, Kalyanpur, UP - 208016',
      qualification:'M.TECH(Geology), IIT-ISM', profession:'Housewife' }) },

  { label: 'G4_6', name: 'Soumitri Mishra', nickname: 'Bapu', gender: 'Male',
    details: det({ dob:'01/08/1980' }) },

  { label: 'G4_7', name: 'Arpita Satpathy', nickname: 'Lipu', gender: 'Female',
    details: det({ dob:'01/05/1991', marriageDate:'08/07/2018', phone:'85990 82753',
      address:'C/O Bibhuti Prasad Rath, Nuasahi, Kapaleswar, Choudwar, Cuttack-754071',
      qualification:'MA (Archeology), Vvihar', profession:'Housewife' }) },

  { label: 'G4_8', name: 'Sushen Prasad Rath', nickname: 'Gunthi', gender: 'Male',
    details: det({ dob:'03/09/1985' }) },

  { label: 'G4_9', name: 'Nibedita Satpathy', nickname: 'Sipu', gender: 'Female',
    details: det({ dob:'23/09/1996', phone:'82491 69390',
      address:'DLF CYBER CITY, ODITEK SOLUTIONS, BHUBANESWAR-751024',
      qualification:'MCA', profession:'Software Engineer' }) },

  { label: 'G4_10', name: 'Mahamaya Mishra', nickname: 'Mama', gender: 'Female',
    details: det({ dob:'12/01/2001', phone:'9777626333', email:'mishra.mahamaya12@gmail.com',
      address:'CVR Hall of Residence, NIT Rourkela, 769008',
      qualification:'NITR-2nd year Electronics Engg' }) },

  { label: 'G4_11', name: 'Binayak Paritosh Mishra', nickname: 'Papa', gender: 'Male',
    details: det({ dob:'18/09/2004', phone:'86580 20074', qualification:'Class-XI [2021]' }) },

  { label: 'G4_12', name: 'Anjali Mohapatra', nickname: 'Duduli', gender: 'Female',
    details: det({ dob:'05/10/1991', marriageDate:'10/02/2023', phone:'96589 18047',
      email:'anjali.mohapatra384@gmail.com',
      address:'At- Jagannath Nivas, Divine Nagar, Chauliaganj, Cuttack-753004',
      qualification:'M.Sc. M.Phil BED', profession:'Teacher' }) },

  { label: 'G4_13', name: 'Shaktipada Mohapatra', nickname: 'Chiku', gender: 'Male',
    details: det({ dob:'17/09/1996', phone:'95834 74197',
      address:'Shaktipada Mahapatra, CTTC, BBSR, B-36, Infocity Avenue, Chandaka Industrial Estate, Gate#3, Khorda-751024',
      qualification:'B.Tech. ELECT', profession:'CTTC Trainer' }) },

  { label: 'G4_14', name: 'Anshuman Mishra', nickname: 'Bagula', gender: 'Male',
    details: det({ dob:'09/05/2005', phone:'70217 76200', email:'2005anshumanmishra@gmail.com',
      qualification:'11th [2021]' }) },

  { label: 'G4_15', name: 'Abhisek Mishra', nickname: 'Dugula', gender: 'Male',
    details: det({ dob:'13/01/2007', phone:'91673 41450', email:'2007.abhisekmishra@gmail.com',
      qualification:'10th [2021]' }) },

  { label: 'G4_16', name: 'Ananya Mishra', nickname: 'Ananya', gender: 'Female',
    details: det({ dob:'15/12/2007', qualification:'Class-IX [2021]' }) },

  { label: 'G4_17', name: 'Kalachand Mishra', nickname: 'Juju', gender: 'Male',
    details: det({ dob:'06/02/2010', qualification:'Class-VI [2021]' }) },

  { label: 'G4_18', name: 'Anandita Panda', nickname: 'Trisha', gender: 'Female',
    details: det({ dob:'31/10/2009', qualification:'Class-VI [2021]' }) },

  { label: 'G4_19', name: 'Amritanshu Panda', nickname: 'Som', gender: 'Male',
    details: det({ dob:'11/02/2013', qualification:'Class-III [2021]' }) },

  { label: 'G4_20', name: 'Piki Panigrahi', nickname: 'Piki', gender: 'Female',
    details: det({ dob:'04/02/2010' }) },

  { label: 'G4_21', name: 'Punyasha Kar', nickname: 'Guddi', gender: 'Female',
    details: det({ dob:'17/05/2006', phone:'88060 93928', qualification:'Class-X [2021]' }) },

  { label: 'G4_22', name: 'Pratyasha Kar', nickname: 'Bubli', gender: 'Female',
    details: det({ dob:'07/04/2011', qualification:'Class-V [2021]' }) },

  { label: 'G4_23', name: 'Shrutakiriti Kar', nickname: 'Gudu', gender: 'Female',
    details: det({ dob:'14/01/2014', qualification:'Class-III [2021]' }) },

  { label: 'G4_24', name: 'Aashinya Kar', nickname: 'Aashi', gender: 'Female',
    details: det({ dob:'12/12/2013', qualification:'Class-III [2021]' }) },

  { label: 'G4_25', name: 'Evanna Kar', nickname: 'Eva', gender: 'Female',
    details: det({ dob:'07/01/2021' }) },

  { label: 'G4_26', name: 'Shanvi Satpathy', nickname: 'Ishu', gender: 'Female',
    details: det({ dob:'30/04/2020' }) },

  { label: 'G4_27', name: 'Unknown', nickname: 'Child of Pintu', gender: 'Female',
    details: det({ dob:'28/02/2024' }) },

  // ── Generation 5 ──
  { label: 'G5_1', name: 'Prasiddhi Panda', nickname: 'Putul', gender: 'Female',
    details: det({ dob:'15/09/2021' }) },

  { label: 'G5_2', name: 'Ibansika Mishra', nickname: 'Titlee', gender: 'Female',
    details: det({ dob:'29/10/2015' }) },

  { label: 'G5_3', name: 'Shreyashi Rath', nickname: 'Twinkle', gender: 'Female',
    details: det({ dob:'01/04/2018' }) },

  { label: 'G5_4', name: 'Unknown', nickname: 'Daughter#2 of Lipu', gender: 'Female', details: {} },
];

// ─── Relationships ─────────────────────────────────────────────────────────────
// Format: [childLabel, parent1Label, parent2Label]
const PARENT_CHILD = [
  ['G2_1','G1_1','G1_2'], ['G2_3','G1_1','G1_2'], ['G2_5','G1_1','G1_2'],
  ['G2_7','G1_1','G1_2'], ['G2_9','G1_1','G1_2'], ['G2_12','G1_1','G1_2'],
  ['G2_14','G1_1','G1_2'],
  ['G3_1','G2_1','G2_2'], ['G3_3','G2_1','G2_2'], ['G3_5','G2_1','G2_2'],
  ['G3_6','G2_1','G2_2'],
  ['G3_7','G2_3','G2_4'], ['G3_9','G2_3','G2_4'], ['G3_11','G2_3','G2_4'],
  ['G3_13','G2_3','G2_4'], ['G3_15','G2_3','G2_4'], ['G3_17','G2_3','G2_4'],
  ['G3_19','G2_3','G2_4'], ['G3_20','G2_3','G2_4'],
  ['G3_22','G2_5','G2_6'], ['G3_24','G2_5','G2_6'],
  ['G3_26','G2_7','G2_8'], ['G3_28','G2_7','G2_8'], ['G3_30','G2_7','G2_8'],
  ['G3_32','G2_9','G2_10'], ['G3_34','G2_9','G2_10'], ['G3_36','G2_9','G2_10'],
  ['G3_37','G2_9','G2_11'], ['G3_38','G2_9','G2_11'],
  ['G3_39','G2_12','G2_13'], ['G3_41','G2_12','G2_13'],
  ['G3_43','G2_14','G2_15'], ['G3_44','G2_14','G2_15'],
  ['G4_1','G3_1','G3_2'],
  ['G4_3','G3_3','G3_4'], ['G4_4','G3_3','G3_4'],
  ['G4_5','G3_7','G3_8'], ['G4_7','G3_7','G3_8'], ['G4_9','G3_7','G3_8'],
  ['G4_10','G3_9','G3_10'], ['G4_11','G3_9','G3_10'],
  ['G4_12','G3_13','G3_14'], ['G4_13','G3_13','G3_14'],
  ['G4_14','G3_11','G3_12'], ['G4_15','G3_11','G3_12'],
  ['G4_16','G3_17','G3_18'],
  ['G4_17','G3_15','G3_16'],
  ['G4_18','G3_20','G3_21'], ['G4_19','G3_20','G3_21'],
  ['G4_20','G3_22','G3_23'],
  ['G4_21','G3_26','G3_27'], ['G4_22','G3_26','G3_27'],
  ['G4_23','G3_28','G3_29'],
  ['G4_24','G3_30','G3_31'], ['G4_25','G3_30','G3_31'],
  ['G4_26','G3_34','G3_35'],
  ['G4_27','G3_41','G3_42'],
  ['G5_1','G4_1','G4_2'],
  ['G5_2','G4_5','G4_6'],
  ['G5_3','G4_7','G4_8'], ['G5_4','G4_7','G4_8'],
];

// Format: [labelA, labelB]
const SPOUSE_PAIRS = [
  ['G1_1','G1_2'],
  ['G2_1','G2_2'], ['G2_3','G2_4'], ['G2_5','G2_6'], ['G2_7','G2_8'],
  ['G2_9','G2_10'], ['G2_9','G2_11'], ['G2_12','G2_13'], ['G2_14','G2_15'],
  ['G3_1','G3_2'], ['G3_3','G3_4'], ['G3_7','G3_8'], ['G3_9','G3_10'],
  ['G3_11','G3_12'], ['G3_13','G3_14'], ['G3_15','G3_16'], ['G3_17','G3_18'],
  ['G3_20','G3_21'], ['G3_22','G3_23'], ['G3_24','G3_25'],
  ['G3_26','G3_27'], ['G3_28','G3_29'], ['G3_30','G3_31'],
  ['G3_32','G3_33'], ['G3_34','G3_35'], ['G3_39','G3_40'], ['G3_41','G3_42'],
  ['G4_1','G4_2'], ['G4_5','G4_6'], ['G4_7','G4_8'],
];

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  const ids = {}; // label → ObjectId

  // ── Step 1: Insert all members ──
  console.log(`Inserting ${MEMBERS.length} members…`);
  let created = 0, skipped = 0;

  for (const m of MEMBERS) {
    const { label, ...memberData } = m;

    // Check for duplicates by nickname (most are unique enough)
    const existing = await Member.findOne({ nickname: memberData.nickname }).lean();
    if (existing) {
      ids[label] = existing._id;
      console.log(`  → Skip (exists) [${label}] "${memberData.name}" (${memberData.nickname})`);
      skipped++;
      continue;
    }

    const doc = await Member.create(memberData);
    ids[label] = doc._id;
    console.log(`  ✓ [${label}] ${memberData.name}`);
    created++;
  }

  console.log(`\nCreated: ${created}, Skipped (duplicate): ${skipped}\n`);

  // ── Step 2: Wire spouse relationships ──
  console.log('Wiring spouse relationships…');
  for (const [a, b] of SPOUSE_PAIRS) {
    const idA = ids[a], idB = ids[b];
    if (!idA || !idB) { console.warn(`  ✗ Missing id for spouse pair ${a}↔${b}`); continue; }
    await Member.findByIdAndUpdate(idA, { $addToSet: { spouses: idB } });
    await Member.findByIdAndUpdate(idB, { $addToSet: { spouses: idA } });
    console.log(`  ✓ Spouse: [${a}] ↔ [${b}]`);
  }

  // ── Step 3: Wire parent-child relationships ──
  console.log('\nWiring parent-child relationships…');
  for (const [child, p1, p2] of PARENT_CHILD) {
    const childId = ids[child], p1Id = ids[p1], p2Id = ids[p2];
    if (!childId || !p1Id) { console.warn(`  ✗ Missing id for parent-child ${child}`); continue; }

    const parentIds = [p1Id];
    if (p2 && p2Id) parentIds.push(p2Id);

    // Set parents on child
    await Member.findByIdAndUpdate(childId, { $addToSet: { parents: { $each: parentIds } } });

    // Set child on all parents
    for (const pid of parentIds) {
      await Member.findByIdAndUpdate(pid, { $addToSet: { children: childId } });
    }
    console.log(`  ✓ Child [${child}] ← Parents [${p1}${p2 ? ', '+p2 : ''}]`);
  }

  // ── Step 4: Verification ──
  console.log('\n── Verification ──');
  const total = await Member.countDocuments();
  console.log(`Total members: ${total}`);

  const checks = [
    { label: 'G1_1', name: 'Prahlad (root)', expectedChildren: 7 },
    { label: 'G2_3', name: 'Shanta Devi',    expectedChildren: 8 },
    { label: 'G2_1', name: 'Prafulla Kumar', expectedChildren: 4 },
    { label: 'G3_1', name: 'Prativa Mishra', expectedChildren: 1 },
  ];

  for (const { label, name, expectedChildren } of checks) {
    const m = await Member.findById(ids[label]).lean();
    if (!m) { console.log(`  ✗ ${name}: not found`); continue; }
    const ok = m.children.length === expectedChildren ? '✓' : '✗';
    console.log(`  ${ok} ${name}: ${m.children.length}/${expectedChildren} children, ${m.spouses.length} spouse(s)`);
  }

  // G5-1 depth check
  const g5 = await Member.findById(ids['G5_1']).lean();
  console.log(`\n  G5-1 Prasiddhi parents: ${g5?.parents?.length ?? 0} (expect 2)`);

  console.log('\n✅ Population complete!');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('\n❌ Fatal:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
