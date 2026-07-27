# Metodología de ranking de FAROFX

> Documento público y reproducible. La posición de cada broker en el ranking sale de esta fórmula, nunca de un acuerdo comercial. Los enlaces de afiliado **no** alteran el orden ni la nota.

## Score editorial (0–10)

El score es una media ponderada de cuatro factores medibles. Cada sub-nota (0–10) se justifica con un dato con **fuente y fecha** en la ficha del broker.

| Factor | Peso | Qué mide | Fuente |
|---|---|---|---|
| `regulacion` | **35 %** | Reguladores de primer nivel, entidad legal, protección/compensación de fondos, segregación de cuentas. Licencias cruzadas en vivo con el registro oficial (CNMV, FCA, CySEC, ASIC, ESMA y reguladores LatAm). | Registro oficial del regulador |
| `retirada` | **25 %** | Velocidad y fiabilidad de retirada; tiempo medio de pago reportado por cuentas verificadas. | Reseñas verificadas + prueba propia |
| `quejas` | **25 %** | Ratio de incidencias abiertas vs. resueltas; sanciones o antecedentes públicos tratados con transparencia. | Reguladores + mediación pública |
| `costes` | **15 %** | Spreads, comisiones, swaps y condiciones publicadas frente a las reales medidas. | Medición propia con fecha |

**Fórmula:** `score = 0.35·regulacion + 0.25·retirada + 0.25·quejas + 0.15·costes`

## Reglas innegociables del veredicto

1. El veredicto y la posición **los decide la evidencia**. Un broker regulado y sólido sale bien de forma natural; uno con problemas, no.
2. **Nada de veredictos prefijados** ni "siempre positivo/negativo" para ninguna marca.
3. **Pros y contras reales** en cada ficha.
4. **Disclosure de afiliación visible** siempre; los enlaces de afiliado no modifican la nota.

## Reseñas de usuarios (estrellas + nº de reseñas)

Complementan al score editorial, no lo sustituyen. Solo se publican reseñas de traders que demuestran cuenta real (prueba de cuenta), con verificación anti-fraude: deduplicación, límites de frecuencia por IP/usuario, detección de campañas y revisión de reseñas atípicas. Alimentan `AggregateRating`.

## Re-verificación

Las licencias y los costes se re-verifican periódicamente. La fecha de "actualizado" de cada ficha es real.
