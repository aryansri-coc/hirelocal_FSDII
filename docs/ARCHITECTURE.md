# HireLocal Architecture Specification

## 1. System Overview
HireLocal connects customers in Tier 3/4 Indian cities with skilled local workers (electricians, AC mechanics, plumbers, carpenters, painters). It solves the dual problem of finding dependable local talent and empowering workers who do not own smartphones through a multilingual AI CallBot.

```
                          ┌────────────────────────┐
                          │   Customer (Web App)   │
                          └───────────┬────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │    HireLocal API Gateway  │
                        │    (Node.js / Express)    │
                        └───────┬───────────┬───────┘
                                │           │
                  ┌─────────────┴─────┐     └─────────────┬─────────────┐
                  ▼                   ▼                   ▼             ▼
          ┌───────────────┐   ┌───────────────┐   ┌───────────────┐ ┌────────────────┐
          │ Matching Eng. │   │ Unified DB    │   │ Reliability   │ │ AI CallBot     │
          │ (Deterministic│   │ (Relational/  │   │ Calculator    │ │ (Dialogue      │
          │  Rule Engine) │   │  JSON Store)  │   │ (Section 7)   │ │  State Machine)│
          └───────────────┘   └───────────────┘   └───────────────┘ └───────┬────────┘
                                                                            │ Telephony
                                                                            ▼
                                                                  ┌──────────────────┐
                                                                  │ Feature Phone    │
                                                                  │ Worker (Hindi)   │
                                                                  └──────────────────┘
```

## 2. Core Loops
1. **Marketplace Loop**: Discover → Compare → Request → Accept/Reject → Connect → Complete → Rate.
2. **Accessibility Loop**: Phone Call → Language Selection → Job Audio Summary → Voice / DTMF Input (1=Accept, 2=Reject, 3=Repeat) → Backend Database Update.
3. **Alternative Worker Loop**: When a selected worker rejects or times out, instant ranked alternative suggestions are offered without re-entering requirements.

## 3. Trust Signal Separation
- **Quality Rating (1 to 5 Stars)**: Customer satisfaction and workmanship quality.
- **Reliability Score (0 to 100%)**: Dependability in accepting and completing jobs without cancellations:
  $$\text{Reliability Score} = \frac{\text{Completed Accepted Jobs}}{\text{Total Accepted Jobs}} \times 100$$
  Workers with fewer than 3 completed jobs display a neutral state: `🌱 New on HireLocal`.

## 4. Deterministic Worker Matching Engine
$$\text{Match Score} = w_1 \cdot \text{Rating} + w_2 \cdot \text{Reliability} + w_3 \cdot \text{Experience} + w_4 \cdot \text{Availability} + w_5 \cdot \text{Location Proximity}$$
- Default configurable weights:
  - Rating: 0.30
  - Reliability: 0.25
  - Experience: 0.15
  - Availability: 0.15
  - Location Proximity: 0.15
