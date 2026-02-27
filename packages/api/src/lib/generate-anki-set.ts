import { createHash } from "crypto";
import JSZip from "jszip";
// Use the asm.js build — pure JS, no WASM file needed
// @ts-expect-error - no types for the direct dist import
import initSqlJs from "sql.js/dist/sql-asm.js";

import { db } from "@acme/db/client";

const SEPARATOR = "\x1F";

function sha1Hex(str: string): string {
  return createHash("sha1").update(str).digest("hex");
}

function checksum(str: string): number {
  return parseInt(sha1Hex(str).substring(0, 8), 16);
}

function getTemplate(deckName: string) {
  const conf = {
    nextPos: 1,
    estTimes: true,
    activeDecks: [1],
    sortType: "noteFld",
    timeLim: 0,
    sortBackwards: false,
    addToCur: true,
    curDeck: 1,
    newBury: true,
    newSpread: 0,
    dueCounts: true,
    curModel: "1435645724216",
    collapseTime: 1200,
  };

  const models = {
    1388596687391: {
      vers: [],
      name: deckName,
      tags: ["Tag"],
      did: 1435588830424,
      usn: -1,
      req: [[0, "all", [0]]],
      flds: [
        {
          name: "Front",
          media: [],
          sticky: false,
          rtl: false,
          ord: 0,
          font: "Arial",
          size: 20,
        },
        {
          name: "Back",
          media: [],
          sticky: false,
          rtl: false,
          ord: 1,
          font: "Arial",
          size: 20,
        },
      ],
      sortf: 0,
      latexPre:
        "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
      tmpls: [
        {
          name: "Card 1",
          qfmt: "{{Front}}",
          did: null,
          bafmt: "",
          afmt: '{{FrontSide}}\n\n<hr id="answer">\n\n{{Back}}',
          ord: 0,
          bqfmt: "",
        },
      ],
      latexPost: "\\end{document}",
      type: 0,
      id: 1388596687391,
      css: ".card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\nbackground-color: white;\n}\n",
      mod: 1435645658,
    },
  };

  const decks = {
    1: {
      desc: "",
      name: "Default",
      extendRev: 50,
      usn: 0,
      collapsed: false,
      newToday: [0, 0],
      timeToday: [0, 0],
      dyn: 0,
      extendNew: 10,
      conf: 1,
      revToday: [0, 0],
      lrnToday: [0, 0],
      id: 1,
      mod: 1435645724,
    },
    1435588830424: {
      desc: "",
      name: deckName,
      extendRev: 50,
      usn: -1,
      collapsed: false,
      newToday: [545, 0],
      timeToday: [545, 0],
      dyn: 0,
      extendNew: 10,
      conf: 1,
      revToday: [545, 0],
      lrnToday: [545, 0],
      id: 1435588830424,
      mod: 1435588830,
    },
  };

  const dconf = {
    1: {
      name: "Default",
      replayq: true,
      lapse: {
        leechFails: 8,
        minInt: 1,
        delays: [10],
        leechAction: 0,
        mult: 0,
      },
      rev: {
        perDay: 100,
        fuzz: 0.05,
        ivlFct: 1,
        maxIvl: 36500,
        ease4: 1.3,
        bury: true,
        minSpace: 1,
      },
      timer: 0,
      maxTaken: 60,
      usn: 0,
      new: {
        perDay: 20,
        delays: [1, 10],
        separate: true,
        ints: [1, 4, 7],
        initialFactor: 2500,
        bury: true,
        order: 1,
      },
      mod: 0,
      id: 1,
      autoplay: true,
    },
  };

  return `
    PRAGMA foreign_keys=OFF;
    BEGIN TRANSACTION;
    CREATE TABLE col (
        id              integer primary key,
        crt             integer not null,
        mod             integer not null,
        scm             integer not null,
        ver             integer not null,
        dty             integer not null,
        usn             integer not null,
        ls              integer not null,
        conf            text not null,
        models          text not null,
        decks           text not null,
        dconf           text not null,
        tags            text not null
    );
    INSERT INTO "col" VALUES(
      1,
      1388548800,
      1435645724219,
      1435645724215,
      11,
      0,
      0,
      0,
      '${JSON.stringify(conf)}',
      '${JSON.stringify(models)}',
      '${JSON.stringify(decks)}',
      '${JSON.stringify(dconf)}',
      '{}'
    );
    CREATE TABLE notes (
        id              integer primary key,
        guid            text not null,
        mid             integer not null,
        mod             integer not null,
        usn             integer not null,
        tags            text not null,
        flds            text not null,
        sfld            integer not null,
        csum            integer not null,
        flags           integer not null,
        data            text not null
    );
    CREATE TABLE cards (
        id              integer primary key,
        nid             integer not null,
        did             integer not null,
        ord             integer not null,
        mod             integer not null,
        usn             integer not null,
        type            integer not null,
        queue           integer not null,
        due             integer not null,
        ivl             integer not null,
        factor          integer not null,
        reps            integer not null,
        lapses          integer not null,
        left            integer not null,
        odue            integer not null,
        odid            integer not null,
        flags           integer not null,
        data            text not null
    );
    CREATE TABLE revlog (
        id              integer primary key,
        cid             integer not null,
        usn             integer not null,
        ease            integer not null,
        ivl             integer not null,
        lastIvl         integer not null,
        factor          integer not null,
        time            integer not null,
        type            integer not null
    );
    CREATE TABLE graves (
        usn             integer not null,
        oid             integer not null,
        type            integer not null
    );
    ANALYZE sqlite_master;
    INSERT INTO "sqlite_stat1" VALUES('col',NULL,'1');
    CREATE INDEX ix_notes_usn on notes (usn);
    CREATE INDEX ix_cards_usn on cards (usn);
    CREATE INDEX ix_revlog_usn on revlog (usn);
    CREATE INDEX ix_cards_nid on cards (nid);
    CREATE INDEX ix_cards_sched on cards (did, queue, due);
    CREATE INDEX ix_revlog_cid on revlog (cid);
    CREATE INDEX ix_notes_csum on notes (csum);
    COMMIT;
  `;
}

export async function generateAnkiSet(ankiSetId: string): Promise<Buffer> {
  const ankiSet = await db.ankiSet.findUniqueOrThrow({
    where: { id: ankiSetId },
    include: { questions: true },
  });

  const SQL = await initSqlJs();
  const sqlDb = new SQL.Database();
  sqlDb.run(getTemplate(ankiSet.title));

  const now = Date.now();
  const topDeckId = now;
  const topModelId = now + 1;

  // Update deck name & id
  const decksResult = sqlDb.exec("SELECT decks FROM col");
  const decksRow = String(decksResult[0]?.values[0]?.[0] ?? "{}");
  const decks = JSON.parse(decksRow) as Record<
    string,
    { name: string; id: number }
  >;
  const deckKeys = Object.keys(decks);
  const lastDeckKey = deckKeys[deckKeys.length - 1];
  if (lastDeckKey) {
    const lastDeck = decks[lastDeckKey];
    if (lastDeck) {
      delete decks[lastDeckKey];
      lastDeck.name = ankiSet.title;
      lastDeck.id = topDeckId;
      decks[String(topDeckId)] = lastDeck;
    }
  }
  sqlDb.run("UPDATE col SET decks=? WHERE id=1", [JSON.stringify(decks)]);

  // Update model name, did & id
  const modelsResult = sqlDb.exec("SELECT models FROM col");
  const modelsRow = String(modelsResult[0]?.values[0]?.[0] ?? "{}");
  const models = JSON.parse(modelsRow) as Record<
    string,
    { name: string; did: number; id: number }
  >;
  const modelKeys = Object.keys(models);
  const lastModelKey = modelKeys[modelKeys.length - 1];
  if (lastModelKey) {
    const lastModel = models[lastModelKey];
    if (lastModel) {
      delete models[lastModelKey];
      lastModel.name = ankiSet.title;
      lastModel.did = topDeckId;
      lastModel.id = topModelId;
      models[String(topModelId)] = lastModel;
    }
  }
  sqlDb.run("UPDATE col SET models=? WHERE id=1", [JSON.stringify(models)]);

  // Add cards
  for (const q of ankiSet.questions) {
    const noteGuid = sha1Hex(`${topDeckId}${q.question}${q.answer}`);
    const noteId = now + Math.floor(Math.random() * 1000000);
    const cardId = noteId + 1;
    const mod = Math.floor(Date.now() / 1000);

    sqlDb.run("INSERT OR REPLACE INTO notes VALUES(?,?,?,?,?,?,?,?,?,?,?)", [
      noteId,
      noteGuid,
      topModelId,
      mod,
      -1,
      "",
      q.question + SEPARATOR + q.answer,
      q.question,
      checksum(q.question + SEPARATOR + q.answer),
      0,
      "",
    ]);

    sqlDb.run(
      "INSERT OR REPLACE INTO cards VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        cardId,
        noteId,
        topDeckId,
        0,
        mod,
        -1,
        0,
        0,
        179,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        "",
      ],
    );
  }

  const binaryArray = sqlDb.export();
  sqlDb.close();

  const zip = new JSZip();
  zip.file("collection.anki2", Buffer.from(binaryArray));
  zip.file("media", "{}");

  const result = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return result;
}
