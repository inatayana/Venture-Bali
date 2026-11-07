feat(pricing): age-tiered booking + UI rollout

Adds kids/youth per-pax price tiers to PriceTier admin schema and editor
(kids 3-10, youth 11-16; adult fallback when blank; kids/youth never above
adult price). Booking widget shows age steppers (adults/kids/youth/infants)
when a tier uses AGE_TIERED; schema enforces sum=paxCount and >=1 adult;
persist adultsCount/kidsCount/youthCount/infantCount to Booking. Estimator
and scoring pass the age breakdown through computeQuote. Cards and modal
show kids/youth pricing hints. Variant mapper exposes infantEnabled and the
price tier pricingModel. PDP detail panel hints age pricing. Repo seed
fixtures updated to include the new tier fields.