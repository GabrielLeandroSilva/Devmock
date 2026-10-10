---
title: "Índice Processos"
type: moc
status: revisao
fase: 2
tags: [devmock/indice]
related: []
created: 2026-10-10
updated: 2026-10-10
---

# Índice — Processos

```dataview
TABLE type AS Tipo, status AS Status
FROM "03-Processos"
SORT file.name ASC
```

Destino: `03-Processos/`. Criar com template `T-Processo`.
Mapear: BPM-01 Init, BPM-02 From-Scratch, BPM-03 Import-OpenAPI, BPM-04 Mock-Develop, BPM-05 Export-Share, BPM-06 Validate.
