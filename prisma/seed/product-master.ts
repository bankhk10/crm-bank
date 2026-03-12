import { PrismaClient } from "@prisma/client";

export async function seedProductMaster(prisma: PrismaClient) {
  console.log(
    "🧴 Seeding Product Master (Product Groups, Chemical Groups, Brands)...",
  );

  // Create Product Groups (Trade Name Groups)
  await prisma.productGroupMaster.createMany({
    data: [
      { code: "คอนซัลท์", description: "คอนซัลท์" },
      { code: "พาเหรด", description: "พาเหรด" },
      { code: "สติมเท็กซ์", description: "สติมเท็กซ์" },
      { code: "อัคคาบัน", description: "อัคคาบัน" },
      { code: "อัลเทอร่า แมกซิงค์", description: "อัลเทอร่า แมกซิงค์" },
      { code: "เทคนิค", description: "เทคนิค" },
      { code: "เทอรา-ซอรบ์", description: "เทอรา-ซอรบ์" },
    ],
    skipDuplicates: true,
  });

  // Create Chemical Groups
  await prisma.chemicalGroup.createMany({
    data: [
      {
        code: "ACE",
        name: "ACETOCHLOR : Herbicide",
      },
      {
        code: "ACT",
        name: "ACETAMIPRID : Insecticide",
      },
      {
        code: "AGN",
        name: "AGNIQUE : Adjuvant",
      },
      {
        code: "ALA",
        name: "ALACHLOR : Herbicide",
      },
      {
        code: "AME",
        name: "AMETRYN : Herbicide",
      },
      {
        code: "AMI",
        name: "AMITRAZ : Acaricide",
      },
      {
        code: "AMN",
        name: "AMINO / CHELANT : Plant Nutrient",
      },
      {
        code: "ATR",
        name: "ATRAZINE : Herbicide",
      },
      {
        code: "BAC",
        name: "BACILLUS THURINGIENSIS KURSTAKI",
      },
      { code: "BB5", name: "BB-5 : Adjuvant" },
      {
        code: "BIS",
        name: "BISPYRIBAC-SODIUM : Herbicide",
      },
      {
        code: "BPR",
        name: "BUTACHLOR + PROPANIL : Herbicide",
      },
      {
        code: "BUP",
        name: "BUPROFEZIN : Insecticide",
      },
      {
        code: "BUT",
        name: "BUTACHLOR : Herbicide",
      },
      {
        code: "CAB",
        name: "CALCIUM BORON : Plant Nutrient",
      },
      {
        code: "CAR",
        name: "CARBENDAZIM : Fungicide",
      },
      {
        code: "CBR",
        name: "CARBARYL : Insecticide",
      },
      {
        code: "CHC",
        name: "CHLORPYRIFOS + CYPERMETHRIN : Insecticide",
      },
      {
        code: "CHL",
        name: "CHLORPYRIFOS : Insecticide",
      },
      {
        code: "CPR",
        name: "CLOMAZONE + PROPANIL : Herbicide",
      },
      {
        code: "CYP",
        name: "CYPERMETHRIN : Insecticide",
      },
      {
        code: "CYR",
        name: "CYPERMETHRIN + PROFENOFOS : Insecticide",
      },
      {
        code: "DAZ",
        name: "DIFENOCONAZOLE + AZOXYSTROBIN : Fungicide",
      },
      {
        code: "DEE",
        name: "DEEORNIC (SODIUM COMPLEX) : PLG",
      },
      {
        code: "DIP",
        name: "DIFENOCONAZOLE + PROPICONAZOLE : Fungicide",
      },
      {
        code: "DIU",
        name: "DIURON : Herbicide",
      },
      {
        code: "EMA",
        name: "EMAMECTIN : Insecticide",
      },
      { code: "ETH", name: "ETHEPHON : PGR" },
      {
        code: "ETI",
        name: "ETHION : Insecticide",
      },
      {
        code: "FDMP",
        name: "DIMETHOMORPH + PYRACLOSTROBIN : Fungicide",
      },
      {
        code: "FEN",
        name: "FENOBUCARB : Insecticide",
      },
      {
        code: "FFAZ",
        name: "AZOXYSTROBIN : Fungicide",
      },
      {
        code: "FIP",
        name: "FIPRONIL : Insecticide",
      },
      {
        code: "FISO",
        name: "ISOPROTHIOLANE : Fungicide",
      },
      {
        code: "FOM",
        name: "FOMESAFEN : Herbicide",
      },
      {
        code: "FOS",
        name: "FOSETYL ALUMINIUM : Fungicide",
      },
      {
        code: "FPHA",
        name: "PHOSPHONIC ACID : Fungicide",
      },
      {
        code: "FPRM",
        name: "PROPAMOCARB + METALAXYL : Fungicide",
      },
      {
        code: "FPRY",
        name: "PROCYMIDONE : Fungicide",
      },
      {
        code: "FTRC",
        name: "TRICYCLAZOLE : Fungicide",
      },
      {
        code: "GIB",
        name: "GIBBERELLIC ACID : PGR",
      },
      {
        code: "GLU",
        name: "GLUFOSINATE : Herbicide",
      },
      {
        code: "GLY",
        name: "GLYPHOSATE : Herbicide",
      },
      {
        code: "HFEO",
        name: "FENOXAPROP-P-ETHYL : Herbicide",
      },
      {
        code: "HFLU",
        name: "FLUMIOXAZIN : Herbicide",
      },
      {
        code: "HPIM",
        name: "PENDIMETHALIN + IMAZAPIC : Herbicide",
      },
      {
        code: "HSME",
        name: "S-METOLACHLOR : Herbicide",
      },
      {
        code: "HTRL",
        name: "TRICLOPYR : Herbicide",
      },
      {
        code: "ICHO",
        name: "CHLORFENAPYR : Insecticide",
      },
      {
        code: "IDIF",
        name: "DIFLUBENZURON : Insecticide",
      },
      {
        code: "ILAM",
        name: "LAMBDA-CYHALOTHRIN : Insecticide",
      },
      {
        code: "IMA",
        name: "IMAZAPIC : Herbicide",
      },
      {
        code: "IMI",
        name: "IMIDACLOPRID : Insecticide",
      },
      {
        code: "INE",
        name: "INDOXACARB + EMAMECTIN : Insecticide",
      },
      {
        code: "ISPI",
        name: "SPIROMESIFEN : Insecticide",
      },
      {
        code: "MAC",
        name: "MANCOZEB + CARBENDAZIM : Fungicide",
      },
      {
        code: "MAN",
        name: "MANCOZEB : Fungicide",
      },
      {
        code: "MES",
        name: "METSULFURON-METHYL : Herbicide",
      },
      {
        code: "MET",
        name: "METHOMYL : Insecticide",
      },
      {
        code: "MTL",
        name: "METALAXYL : Fungicide",
      },
      {
        code: "NIC",
        name: "NICLOSAMIDE-OLAMINE : Insecticide",
      },
      { code: "OTH", name: "OTHER (อื่นๆ)" },
      { code: "PAC", name: "PACLOBUTRAZOL : PGR" },
      {
        code: "PAR",
        name: "PARAQUAT : Herbicide",
      },
      {
        code: "PEN",
        name: "PENDIMETHALIN : Herbicide",
      },
      {
        code: "PIR",
        name: "PIRIMIPHOS-METHYL : Insecticide",
      },
      {
        code: "PPN",
        name: "PROPINEB : Fungicide",
      },
      {
        code: "PRC",
        name: "PROCHLORAZ : Fungicide",
      },
      {
        code: "PRE",
        name: "PRETILACHLOR : Herbicide",
      },
      {
        code: "PRF",
        name: "PROFENOFOS : Insecticide",
      },
      {
        code: "PRI",
        name: "PROPICONAZOLE : Fungicide",
      },
      {
        code: "PYI",
        name: "PYRIDABEN : Acaricide",
      },
      {
        code: "PYM",
        name: "PYMETROZINE : Insecticide",
      },
      {
        code: "PYR",
        name: "PYRAZOSULFURON : Herbicide",
      },
      {
        code: "QUI",
        name: "QUIZALOFOP-P-TEFURYL : Herbicide",
      },
      {
        code: "SEA",
        name: "SEARIDE : SEAWEED",
      },
      {
        code: "SEP",
        name: "SEAPLANT : SEAWEED",
      },
      { code: "SEW", name: "SEAWEED" },
      {
        code: "SLVS",
        name: "EMULANT LVS : SURFACTANT",
      },
      {
        code: "SUL",
        name: "SULPHUR : Fungicide",
      },
      {
        code: "TER",
        name: "TERASORB FOLIAR / 4 MACRO : Plant Nutrient",
      },
      { code: "THI", name: "THIOUREA : PGR" },
      {
        code: "TRI",
        name: "TRIAZOPHOS : Insecticide",
      },
      {
        code: "VAL",
        name: "VALIDAMYCIN : Fungicide",
      },
    ],
    skipDuplicates: true,
  });

  // Create Product ABC Types (ประเภทสินค้า ABC)
  await prisma.productABCTypes.createMany({
    data: [
      { code: "A", name: "A", description: "สินค้าขายดี" },
      { code: "B", name: "B", description: "สินค้ารอง" },
      { code: "C", name: "C", description: "สินค้าตามฤดูกาล" },
    ],
    skipDuplicates: true,
  });

  // Create Brands
  await prisma.brand.createMany({
    data: [{ code: "cropsciences", description: "Crop Science" }],
    skipDuplicates: true,
  });

  console.log("✅ Product Master Data seeded.");
}
