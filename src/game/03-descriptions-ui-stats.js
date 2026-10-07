function artifactDescription(item) {
  if (!item) return "";
  if (item.id === "a6") return `During reveal, add ${artifactValue(20)} to the TARGET.`;
  if (item.id === "a7") return "Pick a non-boss DAMNED and swap your effective guess with theirs.";
  if (item.id === "a8") return `Pick a DAMNED; their guess counts ${artifactCount(5)} times for the TARGET average.`;
  if (item.id === "a9") return "Pick a DAMNED; remove their guess from the TARGET average, though they still take damage.";
  if (item.id === "a10") {
    return `Gain ${artifactValue(3)} to ${artifactValue(10)} SIN.`;
  }
  if (item.id === "a11") {
    return `Pick two non-boss DAMNED. The first takes ${artifactPercentValue(30)}% max-HEALTH damage. The second overheals ${artifactPercentValue(30)}% max HEALTH and copies the first's ability.`;
  }
  if (item.id === "a12") return `You take ${artifactPercentValue(50)}% less damage this round, including CRITICAL damage. Multiple uses stack multiplicatively.`;
  if (item.id === "a13") {
    return "Removed.";
  }
  if (item.id === "a14") return `During reveal, reduce the TARGET by ${artifactValue(10)}. The TARGET can go below zero.`;
  if (item.id === "a15") {
    const extra = sacrificialDaggerExtraDamage("p70");
    return `Pick a target. Deal ${artifactPercentValue(20)}% max-HEALTH damage to non-boss DAMNED, or ${artifactPercentValue(sacrificialDaggerBossPercent())}% to BOSSES${extra ? `, plus ${extra} flat damage from Seal of Amy` : ""}.`;
  }
  if (item.id === "a16") return `Gain a random ${artifactValue(3)} to ${artifactValue(9)} SIN.`;
  if (item.id === "a18") {
    return `Instantly copy the effect of the last non-Crystal ARTIFACT you used. Last: ${lastUsedArtifactName()}.`;
  }
  if (item.id === "a21") {
    return "This round, whenever you take damage, each DAMNED takes max-HEALTH damage equal to the same percent of your max HEALTH that you took.";
  }
  if (item.id === "a22") {
    return "+1 CRITICAL range for the round.";
  }
  if (item.id === "a23") return "Double the ELITE chance for the Seal slot on the next Devil's Offerings reroll.";
  if (item.id === "a25") return "Pick a DAMNED. Next round, reveal its guess and give it +3 BOUNTY.";
  if (item.id === "a26") {
    return "Reserved for a future ARTIFACT.";
  }
  if (item.id === "a28") {
    const value = artifactValue(6);
    return `Pick a DAMNED. It gains ${value} MEMORY, ${value} SIN, and heals ${artifactPercentValue(6)}% max HEALTH.`;
  }
  return normalizeGameText((item.description || "").replace(/^One use\.\s*/i, ""));
}

function itemDescription(item) {
  if (!item) return "";
  if (item.type === "active") return artifactDescription(item);
  if (item.type !== "passive") return normalizeGameText((item.description || "").replace(/^One use\.\s*/i, ""));
  const stack = item.stack || 1;
  if (isSelfStackingSeal(item)) return selfStackingSealDescription(item);
  if (item.id === "p28") {
    const target = mimicTargetEntry();
    if (!target) return "Copies a random SEAL you own. If no SEAL is available, it waits for the next SEAL you buy.";
    const copiedVersion = passiveDisplayName({ ...target, stack });
    return `Copies ${target.name} as ${copiedVersion}. If the copied SEAL is sold, Ose chooses another owned SEAL.`;
  }
  if (item.id === "p39") return `Seal of Purson stacks: ${item.counter || 0}. Rounds without buying from Devil's Offerings add 1 stack. Buying an offering resets stacks. End of round pays ${Math.ceil((item.counter || 0) * passivePower(item))} SIN.`;
  if (item.id === "p111") {
    const lastRoll =
      item.lastSatanDivisor && item.lastSatanMaxDivisor
        ? ` Last divisor: ${item.lastSatanDivisor}. Last damage: ${item.lastSatanDamage || 0}.`
        : "";
    return `Takes 2 SEAL slots. At end of round, divide 666 by a random number from 1 to ${satanSealMaxDivisor(item)} and deal the result as damage to every DAMNED.${lastRoll}`;
  }
  if (stack <= 1) return item.description;
  if (item.id === "p1") return `New non-boss DAMNED arrive with 3 MEMORY. At end of round, each DAMNED takes ${flatDamageValue(item, 1)} damage per MEMORY.`;
  if (item.id === "p2") {
    return `Close guesses pay SIN: ${doubledStackValue(item, 1)} at +/-5, adding ${doubledStackValue(item, 1)} per step closer through ${doubledStackValue(item, 5)} at +/-1. On exact TARGET, gain ${doubledStackValue(item, 10)} SIN.`;
  }
  if (item.id === "p3") return `If the rounded TARGET is a multiple of 3, all DAMNED take ${divisibleVerdictDamage(item)} extra damage.`;
  if (item.id === "p4") {
    return `If your final effective guess is 0, 50, or 100, deal ${edgeGambitDamage(item)} damage to every DAMNED, take half TARGET-difference damage, and ignore worst guess penalty damage.`;
  }
  if (item.id === "p5") return `Whenever you take damage, all DAMNED take ${flatDamagePower(item)}x that damage as extra damage.`;
  if (item.id === "p6") return `Your CRITICAL hit triggers within ${criticalCalipersWindow(item)} of the right integer.`;
  if (item.id === "p7") return `When you hit CRITICAL, it deals ${pressureSpikeDamage(item)} damage to everyone else.`;
  if (item.id === "p8") return `At end of round, gain ${slowRepairSin(item)} SIN.`;
  if (item.id === "p9") return `Every DAMNED elimination spreads ${passiveConvertedSin(item, 3)} SIN and 3 MEMORY randomly among the DAMNED of the next round.`;
  if (item.id === "p10") {
    const bonus = eliteLevels(item);
    return `Half of MEMORY gained by a DAMNED is converted to BOUNTY, rounded down. Half of BOUNTY gained by a DAMNED is converted to MEMORY, rounded down${bonus ? `, plus ${bonus} extra when it triggers` : ""}.`;
  }
  if (item.id === "p11") {
    return `When a DAMNED dies, gain ${stack} random ARTIFACT${stack === 1 ? "" : "S"} with 0 sell value if you have room.`;
  }
  if (item.id === "p12") return `At end of round, for every 10 SIN you have, deal ${flatDamageValue(item, 2)} damage to every DAMNED.`;
  if (item.id === "p13") {
    return `If two or more DAMNED are eliminated in a round, gain ${scaledPassiveValueForItem(item, 8)} SIN. If two or more share a personality, gain ${scaledPassiveValueForItem(item, 16)} SIN.`;
  }
  if (item.id === "p14") {
    return `At the start of each round, deal ${flatDamageValue(item, 20)} damage to a random DAMNED and change their personality to STUBBORN. If that damage eliminates them, gain ${scaledPassiveValueForItem(item, 8)} SIN.`;
  }
  if (item.id === "p15") {
    return `Whenever MEMORY would be added to a DAMNED, add +1 extra MEMORY and deal ${bathinMemoryDamage(item)} damage to that DAMNED.`;
  }
  if (item.id === "p16") {
    return `If a DAMNED's guess is less than 5 away from their previous guess, they take ${flatDamageValue(item, 10)} damage. If it is exactly the same, they take ${flatDamageValue(item, 30)} damage.`;
  }
  if (item.id === "p17") {
    return `At end of round, deal ${flatDamagePower(item)}x the total MEMORY of all DAMNED on the board, including dead ones, to one random living DAMNED. If BOSSES are active, hit all active BOSSES and exclude BOSS MEMORY from the sum.`;
  }
  if (item.id === "p18") return `At end of round, this SEAL's sell value increases by ${scaledPassiveValueForItem(item, 3)}.`;
  if (item.id === "p19") return `Every time a DAMNED dies, deal ${flatDamageValue(item, 5)} damage to every other DAMNED.`;
  if (item.id === "p20") return `Devil's Offerings has ${shopSlotCountForItem(item)} slots. Whenever you use an ARTIFACT, all DAMNED take ${flatDamagePower(item)}x that ARTIFACT's purchase cost as damage.`;
  if (item.id === "p21") return `Every reroll makes all DAMNED take ${shaxRerollDamage(item, 1)} damage per SIN spent at end of round.`;
  if (item.id === "p22") return `Avoid 20% of damage you would take in a round, rounded down. The avoided damage becomes ${doubledStackPower(item)}x MEMORY for the living DAMNED with the most MEMORY.`;
  if (item.id === "p23") return `New non-boss DAMNED have a ${Math.min(100, Math.round(33 * passivePower(item)))}% chance to spawn with +6 BOUNTY.`;
  if (item.id === "p24") return `You can use only one ARTIFACT per round. All DAMNED pay ${bountyOathMultiplierForItem(item).toFixed(1)}x BOUNTY SIN when eliminated.`;
  if (item.id === "p25") return `Gain +${baseEditionBonus(item)} ARTIFACT uses per round and +${baseEditionBonus(item)} ARTIFACT inventory slots.`;
  if (item.id === "p26") return `Using two matching ARTIFACTS in a round deals ${twinDetonatorDamage(item)} damage to all DAMNED.`;
  if (item.id === "p27") return `Every ARTIFACT triggers one outcome: gain ${reactiveWarrantySin(item)} SIN, deal ${reactiveWarrantyDamage(item)} damage to a random DAMNED, or refund its purchase cost.`;
  if (item.id === "p29") return `For every 2 SIN spent this round, deal ${furfurDamage(item)} damage to the highest-HEALTH DAMNED.`;
  if (item.id === "p30") return `Every DAMNED elimination deals ${andrealphusDamage(item)} damage to the DAMNED on its left and right.`;
  if (item.id === "p31") return `At end of round, two random DAMNED take ${flatDamagePower(item)}x their BOUNTY as damage.`;
  if (item.id === "p32") return `Every DAMNED death gives each other living DAMNED +${Math.ceil(passivePower(item))} to +${Math.ceil(2 * passivePower(item))} BOUNTY.`;
  if (item.id === "p33") return `Every DAMNED elimination makes all other DAMNED take ${flatDamagePower(item)}x that DAMNED's BOUNTY as damage.`;
  if (item.id === "p34") {
    return `When a DAMNED with 6 or more BOUNTY dies, deal ${flatDamageValue(item, 10)} damage to the highest-HEALTH enemy and give it +${scaledPassiveValueForItem(item, 1)} BOUNTY.`;
  }
  if (item.id === "p35") return `At end of round, the two highest BOUNTY DAMNED gain +${stack} BOUNTY.`;
  if (item.id === "p36") return "Removed.";
  if (item.id === "p37") return `If you take 4 or less TARGET-difference damage in a round, gain ${lowProfileRewardSin(item)} SIN.`;
  if (item.id === "p38") return `Start each round by marking a DAMNED. If it dies, its BOUNTY payout becomes at least ${scaledPassiveValueForItem(item, 6)} SIN or ${Math.round(200 * passivePower(item))}% BOUNTY, and you gain ${passiveConvertedSin(item, 5)} SIN.`;
  if (item.id === "p40") return `At end of round, deal ${flatDamagePower(item)}x half the total BOUNTY of living DAMNED to every enemy.`;
  if (item.id === "p41") return `If the rounded TARGET is a multiple of 7, gain SIN equal to ${Math.round(passivePower(item) * 100)}% of your current SIN.`;
  if (item.id === "p42") {
    return `When a DAMNED with 3 or less MEMORY dies, gain ${Math.round(100 * passivePower(item))}% of its MEMORY as SIN. If it had more than 3 MEMORY, split its MEMORY between adjacent DAMNED.`;
  }
  if (item.id === "p43") return `Whenever a DAMNED loses SIN, it takes ${flatDamageValue(item, 20)} damage. At end of round, all DAMNED lose 1 SIN.`;
  if (item.id === "p44") return `At end of round, non-boss DAMNED with ${andromaliusBountyLimit(item)} or less BOUNTY are eliminated. Their SIN goes to the living DAMNED with the highest BOUNTY.`;
  if (item.id === "p45") return `DAMNED with 3 or less BOUNTY pay ${Math.round(200 * passivePower(item))}% BOUNTY SIN when eliminated.`;
  if (item.id === "p46") return `Whenever a DAMNED with 6 or more BOUNTY takes damage, it takes ${barbatosDamage(item)} extra damage.`;
  if (item.id === "p47") return `At end of round, ${stack} DAMNED lose half their BOUNTY and you gain double the SIN removed.`;
  if (item.id === "p48") return `At start of round, double ${stack} random DAMNED ${stack === 1 ? "BOUNTY" : "BOUNTIES"} for 1 round.`;
  if (item.id === "p49") return `Using an ARTIFACT that targets DAMNED gives each target +${scaledPassiveValueForItem(item, 3)} BOUNTY.`;
  if (item.id === "p50") return `At end of round, 20% of SIN earned this round spreads among DAMNED, prioritizing highest BOUNTY. DAMNED take ${agaresDamagePerSin(item)} damage per BOUNTY gained from this SEAL.`;
  if (item.id === "p51") return `Once each round per DAMNED, when that DAMNED has taken more than 30% max-HEALTH damage, it gains +${scaledPassiveValueForItem(item, 4)} BOUNTY.`;
  if (item.id === "p52") {
    return `At end of round, DAMNED take ${flatDamageValue(item, 3)} damage per MEMORY. BOSSES take ${flatDamageValue(item, 1)} damage per MEMORY instead.`;
  }
  if (item.id === "p53") return `When a non-boss DAMNED is eliminated, gain bonus SIN equal to ${Math.round(100 * passivePower(item))}% of its MEMORY.`;
  if (item.id === "p54") {
    const multiplier = Number(flatDamagePower(item).toFixed(2));
    return `When revealed DAMNED take TARGET-difference damage, each adjacent DAMNED takes ${multiplier}x that damage.`;
  }
  if (item.id === "p55") {
    return `Each excess MEMORY becomes ${sitriExcessMemoryDamage(item)} damage to that DAMNED.`;
  }
  if (item.id === "p56") {
    return `At end of round, spread ${halphasRoundBossDamage()} damage randomly among enemies. ELITE pays ${halphasEliteCredits(item)} SIN each round.`;
  }
  if (item.id === "p57") {
    const multiplier = Number(flatDamagePower(item).toFixed(2));
    return `If a non-boss DAMNED has 10+ MEMORY and 10+ BOUNTY, it is instantly eliminated. ${multiplier}x its max HEALTH becomes damage spread to other DAMNED; if BOSSES are active, BOSSES take the damage.`;
  }
  if (item.id === "p58") {
    return `The worst guess penalty hits the 3 furthest guesses. The furthest takes ${flatDamageValue(item, 20)} damage, and the next two take ${flatDamageValue(item, 10)}.`;
  }
  if (item.id === "p59") {
    return `Reveal one extra DAMNED each round. Revealed DAMNED gain +${scaledPassiveValueForItem(item, 2)} BOUNTY and +2 MEMORY permanently.`;
  }
  if (item.id === "p60") {
    return `Whenever you use an ARTIFACT, 50% chance to create a copy of it in your inventory and deal ${gaapDamage(item)} damage to every DAMNED.`;
  }
  if (item.id === "p61") {
    return `BOSSES can have their guess revealed. At the start of each round, each revealed DAMNED gains 1 poison. At end of round, each poison deals ${poisonPercentPerCounter(item)}% max-HEALTH damage.`;
  }
  if (item.id === "p62") return `The first time each full-HEALTH DAMNED takes damage in a round, it takes ${fullHealthExtraDamage(item)} extra damage.`;
  if (item.id === "p63") {
    return `Revealed DAMNED take ${revealedExtraDamage(item)} extra damage whenever they take damage.`;
  }
  if (item.id === "p64") {
    return `Revealed DAMNED pay ${revealedBountyMultiplier(item).toFixed(1)}x BOUNTY SIN when eliminated.`;
  }
  if (item.id === "p65") return `At end of round, revealed DAMNED take ${flatDamagePower(item)}x half their guess as damage.`;
  if (item.id === "p66") return `When the TARGET is a multiple of 5, eliminate one random non-boss DAMNED. If BOSSES are active, each active BOSS takes ${aimBossDamage(item)} damage.`;
  if (item.id === "p67") return `DAMNED with 8 or more MEMORY pay ${memoryBountyMultiplier(item).toFixed(1)}x BOUNTY SIN when eliminated.`;
  if (item.id === "p68") {
    return `Once per round per DAMNED, a DAMNED with 8 or more MEMORY takes ${vapulaMemoryExtraDamage(item, 8)} extra damage the first time it takes damage. With more than 12 MEMORY, it takes ${vapulaMemoryExtraDamage(item, 13)} extra damage.`;
  }
  if (item.id === "p69") {
    return `Whenever a DAMNED hits CRITICAL, your guess counts as CRITICAL too and DAMNED CRITICAL damage cannot hurt you. DAMNED hit CRITICAL within +/-${eligosBotCriticalWindow(item)} of the TARGET.`;
  }
  if (item.id === "p70") {
    return `Sacrificial Dagger deals ${sacrificialDaggerExtraDamage(item)} extra flat damage and appears ${sacrificialDaggerShopWeight(item)}x as often in Devil's Offerings.`;
  }
  if (item.id === "p71") {
    const values = sallosShiftValues(item);
    return `Before damage calculation, all DAMNED guesses shift away from the TARGET by random ${values.join(", ")} without changing the average.`;
  }
  if (item.id === "p72") {
    return `Previous TARGET below 40 sets one non-boss DAMNED guess to 100; above 40 sets one DAMNED guess to 0. ELITE deals ${furcasSelectedDamage(item)} damage to the selected DAMNED.`;
  }
  if (item.id === "p73") {
    return `When a DAMNED dies from excess damage, split ${flatDamagePower(item)}x that excess damage equally among the other living enemies.`;
  }
  if (item.id === "p74") return `DAMNED with 10 or more BOUNTY take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage from all sources.`;
  if (item.id === "p75") return `Revealed DAMNED take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage from all sources.`;
  if (item.id === "p76") {
    return `Non-boss DAMNED with 10 or more MEMORY take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage from all sources. If a BOSS is active, this SEAL's damage is dealt to that BOSS instead.`;
  }
  if (item.id === "p77") return `If you scored CRITICAL this round, DAMNED take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage from all sources next round.`;
  if (item.id === "p78") {
    return `STUBBORN DAMNED take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage from all sources.`;
  }
  if (item.id === "p79") return `DAMNED take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage from all sources if an ARTIFACT was used on them this round.`;
  if (item.id === "p80") {
    return `DAMNED take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage if they have more than 10 TARGET-difference damage. Worst guess damage counts as TARGET-difference damage.`;
  }
  if (item.id === "p81") return "If a DAMNED has more than 16 MEMORY, their guess is revealed.";
  if (item.id === "p82") {
    return `Using an ARTIFACT on a DAMNED has a ${Math.round(Math.min(1, 0.5 + Math.max(0, stack - 1) * 0.1) * 100)}% chance to reveal their guess.`;
  }
  if (item.id === "p84") {
    return `At end of round, every revealed DAMNED makes adjacent DAMNED take ${flatDamagePower(item)}x the TARGET-difference damage it took this round. Worst guess penalty counts.`;
  }
  if (item.id === "p85") {
    return `At end of round, each DAMNED takes ${flatDamageValue(item, 10)} damage for every other living DAMNED with the same personality.`;
  }
  if (item.id === "p86") {
    return `When a DAMNED is eliminated, ${Math.round(Math.min(1, 0.5 + Math.max(0, stack - 1) * 0.1) * 100)}% chance the replacement inherits its personality, MEMORY, name, number, and flag.`;
  }
  if (item.id === "p87") {
    return `When a DAMNED is eliminated, deal ${flatDamageValue(item, 30)} damage to each other living DAMNED with the same personality.`;
  }
  if (item.id === "p88") {
    return `When a DAMNED dies, ${scaledPassiveValueForItem(item, 50) / 100}x its BOUNTY is added to each other living DAMNED with the same personality, and you gain ${Math.round(passivePower(item) * 100)}% of its BOUNTY.`;
  }
  if (item.id === "p89") {
    return `DAMNED can only be ANALYST or STUBBORN. At end of round, a DAMNED takes ${flatDamageValue(item, 5)} damage if both adjacent DAMNED have the same personality.`;
  }
  if (item.id === "p90") {
    return `Whenever a DAMNED's personality is altered by a SEAL or ARTIFACT, they take ${flatDamageValue(item, 10)} damage. At end of round, one DAMNED changes to the most prevalent personality.`;
  }
  if (item.id === "p91") {
    return `Scoring CRITICAL increases your CRITICAL range by +1, up to +4. Missing CRITICAL resets it. ELITE adds +${eliteLevels(item) * 5} CRITICAL damage. Current range bonus: +${ascendingCritWindowBonus()}.`;
  }
  if (item.id === "p104") {
    const amount = item.stack || 1;
    return `At end of round, STUBBORN DAMNED gain +${amount} additional MEMORY and +${amount} BOUNTY. Revealed DAMNED become STUBBORN.`;
  }
  if (item.id === "p105") {
    const chance = Math.round(stubbornArtifactChance(item) * 100);
    return `Using an ARTIFACT on a DAMNED has a ${chance}% chance to make them STUBBORN. At end of round, BOSSES take ${flatDamageValue(item, 5)} damage per STUBBORN DAMNED.`;
  }
  if (item.id === "p106") {
    return `At end of round, DAMNED with the most prevalent personality take ${flatDamageValue(item, 5)} damage for every DAMNED with that personality.`;
  }
  if (item.id === "p107") {
    const eliteDamage = eliteLevels(item) * 5;
    return `STUBBORN DAMNED guesses can only be up to 2 away from their previous guess. At start of round, one random DAMNED becomes STUBBORN${eliteDamage ? ` and every STUBBORN DAMNED takes ${eliteDamage} damage` : ""}.`;
  }
  if (item.id === "p108") {
    return `When a STUBBORN DAMNED dies, all BOSSES take ${flatDamageValue(item, 30)} damage.`;
  }
  if (item.id === "p92") return `At reveal, ${devSealChanceText(item)} chance to change the TARGET to your guess.`;
  if (item.id === "p93") return `At reveal, ${devSealChanceText(item)} chance to double every DAMNED BOUNTY.`;
  if (item.id === "p94") return `At reveal, ${devSealChanceText(item)} chance to give 5 random temporary ARTIFACTS usable only this round.`;
  if (item.id === "p95") return `At reveal, ${devSealChanceText(item)} chance for revealed DAMNED to lose 50% current HEALTH.`;
  if (item.id === "p96") {
    return `At reveal, ${devSealChanceText(item)} chance to make every personality STUBBORN. DAMNED already STUBBORN take 25% extra damage this round.`;
  }
  if (item.id === "p97") {
    return `At reveal, ${devSealChanceText(item)} chance for all DAMNED to gain up to the highest living non-boss DAMNED MEMORY and take damage equal to their original MEMORY.`;
  }
  if (item.id === "p110") {
    return `At reveal, ${devSealChanceText(item)} chance to remove all MEMORY and BOUNTY from all DAMNED, then each DAMNED takes damage equal to the total removed MEMORY and BOUNTY.`;
  }
  return item.description;
}

function markPassiveTriggered(id) {
  if (!state.roundState || !passiveStack(id)) return;
  if (directPassiveStack(id)) {
    state.roundState.triggeredPassiveIds.add(id);
    recordSealTrigger(id);
  }
  if (mimicContributionFor(id)) {
    state.roundState.triggeredPassiveIds.add("p28");
    recordSealTrigger("p28");
  }
}

function passiveLimit() {
  return Math.min(MAX_PASSIVE_LIMIT, BASE_PASSIVE_LIMIT + Math.floor(state.bossKills / 2));
}

function rerollCost() {
  return state.rerollBaseCost;
}

function currentRerollCost() {
  return rerollCost();
}

function bossAbilityNullified(bot) {
  return Boolean(bot?.isBoss && state.roundState?.bossAbilityNullifiedBotIds?.has(bot.id));
}

function botHasPassive(bot, key) {
  if (bossAbilityNullified(bot) && bot?.passiveKeys?.includes(key)) return false;
  return Boolean(bot.passiveKeys?.includes(key) || bot.buffPassiveKey === key);
}

function botPassiveKeyName(key) {
  return BOSS_PASSIVES[key]?.name || PYROS_GIFT_PASSIVES[key]?.name || key;
}

function botPassiveKeyDescription(key) {
  return BOSS_PASSIVES[key] ? bossPassiveEffectDescription(key) : PYROS_GIFT_PASSIVES[key]?.description || "";
}

function hasBossPassive(key) {
  return state.bots.some((bot) => bot.hp > 0 && botHasPassive(bot, key));
}

function bossPassiveDamage(key) {
  const passive = BOSS_PASSIVES[key];
  if (!passive) return 0;
  return Math.max(0, Math.ceil(passive.baseDamage || 0));
}

function bossPassiveEffectDescription(key) {
  const damage = bossPassiveDamage(key);
  if (!BOSS_PASSIVES[key]) return "";
  if (key === "sinStealing") return "At the start of each round, removes 20% of your total SIN plus 5 more SIN. The stolen SIN vanishes.";
  if (key === "soullessness") return `When this BOSS is defeated, it does not heal you and instead deals ${damage} damage.`;
  if (key === "soulStealing") return "While this BOSS ability is alive, you cannot recover HEALTH.";
  if (key === "deathRoll") return "If the TARGET is a multiple of 3, you take 3 damage. If it is a multiple of 5, you take 5 damage. If it is a multiple of 7, you take 7 damage.";
  if (key === "rerollToll") return `Every time you reroll Devil's Offerings, you take ${damage} damage.`;
  if (key === "offeringToll") return `Every time you buy an ARTIFACT or SEAL, you take ${damage} damage.`;
  if (key === "avenging") return `If 2 or more DAMNED are eliminated in the same round, you take ${damage} damage.`;
  if (key === "corruption") return "When you submit a guess, 33% chance to shift it by +10 or -10.";
  if (key === "punishment") return `If you eliminate no DAMNED in a round, you take ${damage} damage.`;
  if (key === "lifeSteal") return "Whenever you take damage, this BOSS heals that amount as percent max HEALTH.";
  return "";
}

function activeBotsWithBossPassive(key) {
  return activeBots().filter((bot) => botHasPassive(bot, key));
}

function applyBossPassivePlayerDamage(key, reasonForBot) {
  const damage = bossPassiveDamage(key);
  if (damage <= 0) return 0;
  let total = 0;
  activeBotsWithBossPassive(key).forEach((bot) => {
    total += damagePlayer(damage, reasonForBot(bot, damage), true, true, BOSS_PASSIVES[key]?.name);
  });
  return total;
}

function applyBossSinStealing() {
  activeBotsWithBossPassive("sinStealing").forEach((bot) => {
    const currentSin = Math.max(0, Math.ceil(state.player.credits || 0));
    if (currentSin <= 0) return;
    const amount = Math.ceil(currentSin * 0.2) + 5;
    loseCredits(amount, `${bot.name}'s ${BOSS_PASSIVES.sinStealing.name}`);
  });
}

function deathRollDamageForTarget(target) {
  const value = Math.ceil(target);
  if (!Number.isFinite(value)) return 0;
  let damage = 0;
  if (value % 3 === 0) damage += 3;
  if (value % 5 === 0) damage += 5;
  if (value % 7 === 0) damage += 7;
  return damage;
}

function deathRollMultiplesForTarget(target) {
  const value = Math.ceil(target);
  if (!Number.isFinite(value)) return [];
  return [3, 5, 7].filter((divisor) => value % divisor === 0);
}

function applyDeathRollDamage() {
  const round = state.roundState;
  const damage = deathRollDamageForTarget(round?.target);
  if (damage <= 0) return;
  const multiples = deathRollMultiplesForTarget(round.target).join(", ");
  activeBotsWithBossPassive("deathRoll").forEach((bot) => {
    damagePlayer(
      damage,
      `${bot.name}'s ${BOSS_PASSIVES.deathRoll.name} dealt ${damage} damage because TARGET ${formatNumber(round.target)} is a multiple of ${multiples}.`,
      true,
      true,
      BOSS_PASSIVES.deathRoll.name
    );
  });
}

function applyRerollTollDamage() {
  applyBossPassivePlayerDamage(
    "rerollToll",
    (bot, damage) => `${bot.name}'s ${BOSS_PASSIVES.rerollToll.name} dealt ${damage} damage because you rerolled Devil's Offerings.`
  );
}

function applyOfferingTollDamage(item) {
  applyBossPassivePlayerDamage(
    "offeringToll",
    (bot, damage) => `${bot.name}'s ${BOSS_PASSIVES.offeringToll.name} dealt ${damage} damage because you bought ${item.name}.`
  );
}

function applyRoundEndBossPassiveDamage() {
  const eliminations = state.roundState?.eliminationsThisRound || 0;
  if (eliminations >= 2) {
    applyBossPassivePlayerDamage(
      "avenging",
      (bot, damage) => `${bot.name}'s ${BOSS_PASSIVES.avenging.name} dealt ${damage} damage because ${eliminations} DAMNED were eliminated this round.`
    );
  }
  if (eliminations === 0) {
    applyBossPassivePlayerDamage(
      "punishment",
      (bot, damage) => `${bot.name}'s ${BOSS_PASSIVES.punishment.name} dealt ${damage} damage because no DAMNED were eliminated this round.`
    );
  }
}

function applyCorruptionGuessMutation(guess) {
  let mutated = Math.ceil(guess);
  activeBotsWithBossPassive("corruption").forEach((bot) => {
    if (Math.random() >= 0.33) return;
    const before = mutated;
    const shift = Math.random() < 0.5 ? -10 : 10;
    mutated = Math.ceil(clamp(mutated + shift, 0, playerGuessLimit()));
    state.roundState?.roundEvents.push(`${bot.name}'s ${BOSS_PASSIVES.corruption.name} shifted your guess from ${before} to ${mutated}.`);
  });
  return mutated;
}

function soulStealingBlocker() {
  return activeBotsWithBossPassive("soulStealing")[0] || null;
}

function applyBossLifeStealHealing(playerDamage) {
  const damage = Math.max(0, Math.ceil(playerDamage));
  if (damage <= 0) return;
  activeBotsWithBossPassive("lifeSteal").forEach((bot) => {
    const heal = Math.ceil((bot.maxHp || 0) * (damage / 100));
    if (heal <= 0) return;
    const healed = healBot(bot, heal, null, BOSS_PASSIVES.lifeSteal.name);
    if (healed > 0) addRoundEvent(`${bot.name}'s ${BOSS_PASSIVES.lifeSteal.name} converted ${damage} player damage into ${healed} healing.`);
  });
}

function botHasUniquePower(bot, key) {
  if (bossAbilityNullified(bot)) return false;
  return Boolean(bot && (bot.uniqueKey === key || bot.copiedUniqueKey === key));
}

function activeBossesWithPower(key, excludedIds = new Set()) {
  return state.bots.filter(
    (bot) => bot.isBoss && botHasUniquePower(bot, key) && !excludedIds.has(bot.id) && bot.hp > 0 && !bot.eliminated
  );
}

function aliveUniqueBoss(key, excludedIds = new Set()) {
  return activeBossesWithPower(key, excludedIds).length > 0;
}

function aliveFinalBoss(key) {
  return state.bots.some((bot) => bot.finalKey === key && bot.hp > 0 && !bot.eliminated);
}

function shopDisabledBySatan() {
  return state.finalBossPhase && aliveFinalBoss("satan");
}

function activePetrosPavlosBosses() {
  return state.bots.filter(
    (bot) => bot.isBoss && ["petros", "pavlos"].includes(bot.uniqueKey) && !bossAbilityNullified(bot) && bot.hp > 0 && !bot.eliminated
  );
}

function petrosPavlosRoundModifier() {
  const twins = activePetrosPavlosBosses();
  if (!twins.length) return null;
  const startRound = twins.reduce((earliest, bot) => Math.min(earliest, bot.modifierCycleStartRound || state.round), state.round);
  const cycleIndex = Math.max(0, state.round - startRound) % PETROS_PAVLOS_MODIFIERS.length;
  return PETROS_PAVLOS_MODIFIERS[cycleIndex];
}

function currentTargetModifier() {
  if (state.finalBossPhase) return FINAL_BOSS_TARGET_MODIFIER;
  const twinModifier = petrosPavlosRoundModifier();
  if (twinModifier !== null) return twinModifier;
  const modifierBosses = state.bots
    .filter(
      (bot) =>
        bot.isBoss &&
        bot.hp > 0 &&
        !bot.eliminated &&
        !bossAbilityNullified(bot) &&
        bot.modifierOverride !== null &&
        bot.modifierOverride !== undefined
    )
    .sort((left, right) => right.bossOrder - left.bossOrder);
  return modifierBosses.length ? modifierBosses[0].modifierOverride : BASE_TARGET_MODIFIER;
}

function playerGuessLimit() {
  return 100;
}

function shopTax(item = null) {
  if (!aliveUniqueBoss("zilon") || !item) return 0;
  return item.type === "passive" ? 6 : 3;
}

function shopPrice(item) {
  const duplicateMultiplier = item.type === "passive" && !isSelfStackingSeal(item.id) ? directPassiveStack(item.id) + 1 : 1;
  const basePrice = item.price * duplicateMultiplier;
  const taxedPrice = basePrice + shopTax({ ...item, price: basePrice });
  const discountedPrice = item.type === "passive" ? Math.max(0, taxedPrice - passiveShopDiscount()) : taxedPrice;
  return Math.ceil(discountedPrice * sinPricePressureMultiplier());
}

function botPassiveSummary(bot) {
  if (!bot) return "";
  const names = [];
  if (bot.isBoss && bot.uniqueKey) names.push(`${UNIQUE_BOSS_SPECS[bot.uniqueKey].name}'s Seal`);
  if (bot.isBoss && bot.copiedUniqueKey) names.push(`Borrowed ${UNIQUE_BOSS_SPECS[bot.copiedUniqueKey].name}'s Seal`);
  bot.passiveKeys?.forEach((key) => names.push(botPassiveKeyName(key)));
  if (bot.buffPassiveKey) names.push(`Pyros Gift: ${botPassiveKeyName(bot.buffPassiveKey)}`);
  return names.join(" + ") || "No Seal";
}

function botPassiveDescription(bot) {
  if (!bot) return "";
  const descriptions = [];
  if (bot.isBoss && bot.uniqueKey) descriptions.push(...UNIQUE_BOSS_SPECS[bot.uniqueKey].descriptions);
  if (bot.isBoss && bot.copiedUniqueKey) {
    const copiedSpec = UNIQUE_BOSS_SPECS[bot.copiedUniqueKey];
    const borrowedText = copiedSpec.descriptions
      .join(" ")
      .replaceAll(copiedSpec.name, bot.name)
      .replaceAll(`${copiedSpec.name}'s`, `${bot.name}'s`);
    descriptions.push(`Borrowed power: ${borrowedText}`);
  }
  bot.passiveKeys?.forEach((key) => descriptions.push(botPassiveKeyDescription(key)));
  if (bot.buffPassiveKey) descriptions.push(`Pyros gift: ${botPassiveKeyDescription(bot.buffPassiveKey)}`);
  return descriptions.join(" ");
}

function bossPassiveSummary(bot) {
  return bot?.isBoss ? botPassiveSummary(bot) : "";
}

function bossPassiveDescription(bot) {
  return bot?.isBoss ? botPassiveDescription(bot) : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function normalizeGameText(value) {
  return String(value)
    .replace(/\bnon-bosses\b/gi, "non-boss DAMNED")
    .replace(/\bnon-boss\b/gi, "non-boss")
    .replace(/\bsinners\b/gi, "DAMNED")
    .replace(/\bsinner\b/gi, "DAMNED")
    .replace(/\bbots\b/gi, "DAMNED")
    .replace(/\bbot\b/gi, "DAMNED")
    .replace(/\bbosses\b/gi, (match, offset, text) => (text[offset - 1] === "-" ? "bosses" : "BOSSES"))
    .replace(/\bboss\b/gi, (match, offset, text) => (text[offset - 1] === "-" ? "boss" : "BOSS"))
    .replace(/\bartifacts\b/gi, "ARTIFACTS")
    .replace(/\bartifact\b/gi, "ARTIFACT")
    .replace(/\bseals\b/gi, "SEALS")
    .replace(/\bseal\b/gi, "SEAL");
}

function htmlWithLineBreaks(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function descriptionHtml(value) {
  const protectedPhrases = [];
  const plainTargetText = normalizeGameText(value);
  const protectedText = [
    /\bpick a target\b/gi,
    /\beach target\b/gi,
    /\bchoose a target\b/gi,
    /\bneeds a target\b/gi,
    /\bheal target\b/gi,
    /\bdamage target\b/gi
  ].reduce((text, pattern) => text.replace(pattern, (match) => {
    const token = `__PLAIN_TARGET_${protectedPhrases.length}__`;
    protectedPhrases.push(match);
    return token;
  }), plainTargetText);
  let html = htmlWithLineBreaks(protectedText).replace(
    /\b(SIN|DAMNED|ARTIFACTS?|SEALS?|BOSSES|BOSS|ELITE|CRITICAL|TARGET|KOS?|KO|HEALTH|MEMORY|BOUNTY)\b/gi,
    (keyword, _whole, offset, fullText) => {
      if (/^boss(?:es)?$/i.test(keyword) && fullText[offset - 1] === "-") return keyword.toLowerCase();
      return `<span class="tooltip-keyword">${keyword.toUpperCase()}</span>`;
    }
  );
  protectedPhrases.forEach((phrase, index) => {
    html = html.replace(`__PLAIN_TARGET_${index}__`, escapeHtml(phrase));
  });
  return html;
}

function splitEliteDescription(value) {
  const text = String(value || "").trim();
  const eliteMatch = text.match(/\s+(ELITE(?:\s+levels)?:?[\s\S]*)$/i);
  if (!eliteMatch) return { main: text, elite: "" };
  return {
    main: text.slice(0, eliteMatch.index).trim(),
    elite: eliteMatch[1].trim()
  };
}

function renderSealTooltipHtml(item, displayName, description, disabledNotice, sale) {
  const contribution = sealContributionSummary(item);
  const runDetails = sealContributionDetails(item);
  const splitDescription = splitEliteDescription(description);
  const fallbackElite = splitEliteDescription(ITEMS[item?.id]?.description || "").elite;
  const mainDescription = splitDescription.main || description;
  const eliteDescription = splitDescription.elite || fallbackElite;
  const bodyText = `${disabledNotice || ""}${mainDescription}`;
  return `
    <div class="tooltip-heading">
      <div class="tooltip-title">${escapeHtml(displayName)}</div>
      <div class="tooltip-shift-hint">press shift for more</div>
    </div>
    <div class="tooltip-body">${descriptionHtml(bodyText)}</div>
    ${eliteDescription ? `<div class="tooltip-elite-line">${descriptionHtml(eliteDescription)}</div>` : ""}
    <div class="tooltip-stat-line">${descriptionHtml(runDetails)}</div>
    <div class="seal-tooltip-footer">
      <span>${contribution ? escapeHtml(contribution) : ""}</span>
      <span>Sell ${sale} SIN</span>
    </div>
  `;
}

function sealSigilPath(item) {
  const id = typeof item === "string" ? item : item?.id;
  const file = SEAL_SIGILS[id];
  return file ? `assets/seals/${file}` : "";
}

function renderSealSigil(item, extraClass = "") {
  const src = sealSigilPath(item);
  if (!src) return "";
  const id = typeof item === "string" ? item : item?.id;
  const className = [
    "seal-sigil",
    DEV_SEAL_IDS.has(id) ? "dev-seal-sigil" : "",
    SATAN_SEAL_IDS.has(id) ? "satan-seal-sigil" : "",
    extraClass
  ].filter(Boolean).join(" ");
  const name = typeof item === "string" ? ITEMS[item]?.name || "Seal" : item?.name || "Seal";
  return `<img class="${className}" src="${escapeAttr(src)}" alt="${escapeAttr(`${name} sigil`)}" loading="lazy" />`;
}

function passiveName(id, fallback = "Seal") {
  return ITEMS[id]?.name || fallback;
}

function artifactIconPath(item) {
  const id = typeof item === "string" ? item : item?.id;
  const file = ARTIFACT_ICONS[id];
  return file ? `assets/artifacts/${file}` : "";
}

function renderArtifactIcon(item, extraClass = "") {
  const src = artifactIconPath(item);
  if (!src) return "";
  const className = ["artifact-icon", extraClass].filter(Boolean).join(" ");
  const name = typeof item === "string" ? ITEMS[item]?.name || "Artifact" : item?.name || "Artifact";
  return `<img class="${className}" src="${escapeAttr(src)}" alt="${escapeAttr(`${name} icon`)}" loading="lazy" />`;
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return String(Math.ceil(value));
}

function formatModifier(value) {
  if (!Number.isFinite(value)) return "?";
  return Number.isInteger(value * 10)
    ? value.toFixed(1)
    : value.toFixed(3).replace(/0+$/u, "").replace(/\.$/u, "");
}

function guessClosenessColor(guess, target) {
  if (!Number.isFinite(guess) || !Number.isFinite(target)) return "";
  const distance = Math.abs(guess - target);
  if (distance >= 10) return "";
  const closeness = clamp(1 - distance / 10, 0, 1);
  const intensity = Math.pow(closeness, 2.35) * 0.78;
  const from = { r: 255, g: 255, b: 255 };
  const to = { r: 239, g: 111, b: 97 };
  const mix = (start, end) => Math.round(start + (end - start) * intensity);
  return `rgb(${mix(from.r, to.r)}, ${mix(from.g, to.g)}, ${mix(from.b, to.b)})`;
}

function guessClosenessAttrs(guess, target, isCritical) {
  if (isCritical) return { className: "", style: "" };
  const color = guessClosenessColor(guess, target);
  if (!color) return { className: "", style: "" };
  return {
    className: "guess-closeness-number",
    style: ` style="--guess-closeness-color: ${color}"`
  };
}

function itemCopy(id) {
  const uid = `${id}-${state.nextItemUid++}`;
  const copy = { ...ITEMS[id], uid, stack: ITEMS[id].type === "passive" ? 1 : undefined };
  if (id === "p39") copy.counter = 1;
  if (isSelfStackingSeal(id)) copy.selfDamage = 0;
  return copy;
}

function freeActiveCopy(id) {
  return { ...itemCopy(id), purchaseCost: 0, sellValueOverride: 0 };
}

function devTemporaryActiveCopy(id) {
  const copy = freeActiveCopy(id);
  copy.devTemporary = true;
  copy.sellValueOverride = 0;
  return copy;
}

function devSealChance(idOrItem) {
  const stack = typeof idOrItem === "string" ? simpleStackCount(idOrItem) : idOrItem?.stack || 0;
  if (!stack) return 0;
  return Math.min(0.8, 0.3 + Math.max(0, stack - 1) * 0.05);
}

function devSealEntryChance(entry) {
  if (!entry?.stack) return 0;
  return Math.min(0.8, 0.3 + Math.max(0, entry.stack - 1) * 0.05);
}

function isSelfStackingSeal(idOrItem) {
  const id = typeof idOrItem === "string" ? idOrItem : idOrItem?.id;
  return SELF_STACKING_SEAL_IDS.has(id);
}

function selfStackingSpec(idOrItem) {
  const id = typeof idOrItem === "string" ? idOrItem : idOrItem?.id;
  return SELF_STACKING_SEAL_SPECS[id] || null;
}

function selfStackingCurrentDamage(item) {
  return Math.max(0, Math.ceil(item?.selfDamage || 0));
}

function selfStackingCurrentDamageForId(id) {
  return orderedPassiveEffectEntries(id).reduce((sum, entry) => sum + selfStackingCurrentDamage(entry.item), 0);
}

function selfStackingSealDescription(item) {
  return `${item.description}\nCurrent damage: ${selfStackingCurrentDamage(item)}.`;
}

function selfStackingConditionCounts(round = state.roundState) {
  if (!round) return {};
  if (!round.selfStackingConditionCounts || typeof round.selfStackingConditionCounts !== "object") {
    round.selfStackingConditionCounts = {};
  }
  Object.values(SELF_STACKING_SEAL_SPECS).forEach((spec) => {
    if (!Number.isFinite(round.selfStackingConditionCounts[spec.key])) round.selfStackingConditionCounts[spec.key] = 0;
  });
  return round.selfStackingConditionCounts;
}

function selfStackingGameConditionCounts() {
  if (!state.selfStackingGameConditionCounts || typeof state.selfStackingGameConditionCounts !== "object") {
    state.selfStackingGameConditionCounts = {};
  }
  Object.values(SELF_STACKING_SEAL_SPECS).forEach((spec) => {
    if (!Number.isFinite(state.selfStackingGameConditionCounts[spec.key])) {
      state.selfStackingGameConditionCounts[spec.key] = 0;
    }
  });
  return state.selfStackingGameConditionCounts;
}

function recordSelfStackingCondition(idOrKey) {
  const spec = SELF_STACKING_SEAL_SPECS[idOrKey] || Object.values(SELF_STACKING_SEAL_SPECS).find((entry) => entry.key === idOrKey);
  if (!spec || !state.roundState) return;
  const roundCounts = selfStackingConditionCounts();
  roundCounts[spec.key] = (roundCounts[spec.key] || 0) + 1;
  const gameCounts = selfStackingGameConditionCounts();
  gameCounts[spec.key] = (gameCounts[spec.key] || 0) + 1;
}

function increaseSelfStackingSealDamage(entry) {
  const spec = selfStackingSpec(entry?.id);
  if (!spec || !entry?.item) return 0;
  entry.item.selfDamage = selfStackingCurrentDamage(entry.item) + spec.increment;
  markPassiveEntryTriggered(entry);
  return selfStackingCurrentDamage(entry.item);
}

function triggerSelfStackingSeal(id) {
  recordSelfStackingCondition(id);
  let totalDamage = 0;
  orderedPassiveEffectEntries(id).forEach((entry) => {
    totalDamage += increaseSelfStackingSealDamage(entry);
  });
  return totalDamage;
}

function applySelfStackingMemoryOverTen(bot, beforeMemory, afterMemory) {
  if (!bot || bot.isBoss || bot.eliminated || beforeMemory > 10 || afterMemory <= 10) return;
  const damage = triggerSelfStackingSeal("p99");
  if (damage <= 0) return;
  queueEndOfRoundBotDamage(
    bot,
    damage,
    `${ITEMS.p99.name} dealt ${damage} damage to ${bot.name} for exceeding 10 MEMORY.`,
    ITEMS.p99.name
  );
}

function applySelfStackingBountySumDamage() {
  const targets = activeBots();
  if (!targets.length) return;
  const bountySum = targets.reduce((sum, bot) => sum + botRegularBounty(bot), 0);
  if (bountySum <= 40) return;
  const damage = triggerSelfStackingSeal("p100");
  if (damage <= 0) return;
  damageBots(
    targets,
    damage,
    (bot, dealt) => `${ITEMS.p100.name} dealt ${dealt} damage to ${bot.name} because total BOUNTY was ${bountySum}.`,
    ITEMS.p100.name
  );
}

function queueSelfStackingPentakillDamage() {
  const damage = triggerSelfStackingSeal("p101");
  if (damage <= 0) return;
  state.pendingSelfStackingPentakillDamage = Math.max(0, Math.ceil(state.pendingSelfStackingPentakillDamage || 0)) + damage;
  state.roundState?.roundEvents.push(`${ITEMS.p101.name} queued ${damage} end-of-round damage.`);
}

function applyPendingSelfStackingPentakillDamage() {
  const damage = Math.max(0, Math.ceil(state.pendingSelfStackingPentakillDamage || 0));
  if (damage <= 0) return;
  state.pendingSelfStackingPentakillDamage = 0;
  const targets = activeBots();
  if (!targets.length) return;
  damageBots(
    targets,
    damage,
    (bot, dealt) => `${ITEMS.p101.name} dealt ${dealt} queued PENTAKILL damage to ${bot.name}.`,
    ITEMS.p101.name
  );
}

function applySelfStackingRevealedDeath(bot) {
  if (!bot?.revealedByPassive) return;
  const damage = triggerSelfStackingSeal("p102");
  if (damage <= 0) return;
  const targets = adjacentLivingBots(bot);
  if (!targets.length) return;
  queueEndOfRoundBotDamages(
    targets,
    damage,
    (target, queued) => `${ITEMS.p102.name} dealt ${queued} damage to ${target.name} from ${bot.name}'s revealed death.`,
    ITEMS.p102.name
  );
}

function applySelfStackingStubbornDeath(bot) {
  if (personalityType(bot) !== "Stubborn") return;
  const damage = triggerSelfStackingSeal("p109");
  if (damage <= 0) return;
  const targets = activeBots().filter((target) => personalityType(target) !== "Stubborn");
  if (!targets.length) return;
  queueEndOfRoundBotDamages(
    targets,
    damage,
    (target, queued) => `${ITEMS.p109.name} dealt ${queued} damage to ${target.name} from ${bot.name}'s STUBBORN death.`,
    ITEMS.p109.name
  );
}

function recordArtifactUseForSelfStacking() {
  const before = Math.max(0, Math.floor(state.totalArtifactsUsed || 0));
  const after = before + 1;
  state.totalArtifactsUsed = after;
  const thresholds = Math.floor(after / 20) - Math.floor(before / 20);
  for (let count = 0; count < thresholds; count += 1) {
    triggerSelfStackingSeal("p103");
  }
  const damage = selfStackingCurrentDamageForId("p103");
  if (damage <= 0) return;
  const targets = activeBots();
  if (!targets.length) return;
  queueEndOfRoundBotDamages(
    targets,
    damage,
    (bot, queued) => `${ITEMS.p103.name} dealt ${queued} damage to ${bot.name} from ARTIFACT use.`,
    ITEMS.p103.name
  );
}

function devSealChanceText(idOrItem) {
  return `${Math.round(devSealChance(idOrItem) * 100)}%`;
}

function activeSellValue(item) {
  if (!item) return 0;
  if (Number.isFinite(item.sellValueOverride)) return Math.max(0, Math.ceil(item.sellValueOverride));
  return Math.floor((item.price || 0) / 2);
}

function addLog(message) {
  state.log.unshift(normalizeGameText(message));
  state.log = state.log.slice(0, 5);
}

function showInvalidGuessPopup() {
  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert("Invalid");
  } else {
    addLog("Invalid");
  }
}

function addRoundEvent(message) {
  if (state.roundState) state.roundState.roundEvents.push(normalizeGameText(message));
}

function sourceLabelFromReason(reason, fallback) {
  const text = String(reason || "").trim();
  if (!text) return fallback || "";
  const knownSources = [
    ["FINAL CRITICAL", "Final CRITICAL"],
    ["CRITICAL", "CRITICAL"],
    ["Sacrificial Dagger", "Sacrificial Dagger"],
    ["Engraved Skull", "Engraved Skull"],
    ["Black Candle", "Black Candle"],
    ["Ceremonial Altar", "Ceremonial Altar"],
    ["Demonic Idol", "Demonic Idol"],
    ["Goat Head", "Goat Head"],
    ["Inverted Cross", "Inverted Cross"],
    ["Funeral Coin", "Funeral Coin"],
    ["Vial of Blood", "Vial of Blood"],
    ["Dark Talisman", "Dark Talisman"],
    ["Corrupted Crystal", "Corrupted Crystal"],
    ["Voodoo Doll", "Voodoo Doll"],
    ["Cursed Chalice", "Cursed Chalice"],
    ["Satanic Bible", "Satanic Bible"],
    ["Mummified Lamb", "Mummified Lamb"],
    ["Spirit Board", "Spirit Board"],
    ["The Magical Sword of Solomon", "The Magical Sword of Solomon"],
    ["Demon Bowl", "Demon Bowl"],
    ["The Black-Hilted Knife", "The Black-Hilted Knife"],
    ["Target damage", "Target difference"],
    ["target damage", "Target difference"],
    ["Seal of Leraje", "Seal of Leraje"],
    ["Seal of Paimon", "Seal of Paimon"],
    ["Seal of Haagenti", "Seal of Haagenti"],
    ["Seal of Amdusias", "Seal of Amdusias"],
    ["Seal of Zagan", "Seal of Zagan"],
    ["Seal of Furfur", "Seal of Furfur"],
    ["Seal of Furfur", "Seal of Furfur"],
    ["Seal of Andrealphus", "Seal of Andrealphus"],
    ["The Brazen Vessel of Solomon", "The Brazen Vessel of Solomon"],
    ["Seal of Murmur", "Seal of Murmur"],
    ["Seal of Foras", "Seal of Foras"],
    ["Seal of Marchosias", "Seal of Marchosias"],
    ["Seal of Gremory", "Seal of Gremory"],
    ["Seal of Forneus", "Seal of Forneus"],
    ["Seal of Cimejes", "Seal of Cimejes"],
    ["Seal of Asmoday", "Seal of Asmoday"],
    ["Seal of Malphas", "Seal of Malphas"],
    ["Seal of Astaroth", "Seal of Astaroth"],
    ["Seal of Purson", "Seal of Purson"],
    ["Seal of Focalor", "Seal of Focalor"],
    ["Seal of Bifrons", "Seal of Bifrons"],
    ["Seal of Stolas", "Seal of Stolas"],
    ["Grandier's Pact", "Grandier's Pact"],
    ["Seal of Haures", "Seal of Haures"],
    ["Seal of Vassago", "Seal of Vassago"],
    ["Amulet of Pazuzu", "Amulet of Pazuzu"],
    ["Seal of Alloces", "Seal of Alloces"],
    ["Seal of Shax", "Seal of Shax"],
    ["Seal of Belial", "Seal of Belial"],
    ["Seal of Agares", "Seal of Agares"],
    ["Seal of Phenex", "Seal of Phenex"],
    ["Seal of Marax", "Seal of Marax"],
    ["Seal of Decarabia", "Seal of Decarabia"],
    ["Seal of Belial", "Seal of Belial"],
    ["Seal of Dantalion", "Seal of Dantalion"],
    ["Seal of Sabnock", "Seal of Sabnock"],
    ["Seal of Bune", "Seal of Bune"],
    ["Seal of Sitri", "Seal of Sitri"],
    ["Seal of Halphas", "Seal of Halphas"],
    ["Seal of Balam", "Seal of Balam"],
    ["Seal of Marbas", "Seal of Marbas"],
    ["Seal of Buer", "Seal of Buer"],
    ["Seal of Bathin", "Seal of Bathin"],
    ["Seal of Botis", "Seal of Botis"],
    ["Seal of Gusion", "Seal of Gusion"],
    ["Seal of Raum", "Seal of Raum"],
    ["Seal of Ronove", "Seal of Ronove"],
    ["Seal of Andromalius", "Seal of Andromalius"],
    ["Seal of Botis", "Seal of Botis"],
    ["Seal of Gaap", "Seal of Gaap"],
    ["Seal of Vepar", "Seal of Vepar"],
    ["Seal of Beleth", "Seal of Beleth"],
    ["Seal of Vual", "Seal of Vual"],
    ["Seal of Vine", "Seal of Vine"],
    ["Seal of Naberius", "Seal of Naberius"],
    ["Seal of Aim", "Seal of Aim"],
    ["Seal of Caim", "Seal of Caim"],
    ["Seal of Vapula", "Seal of Vapula"],
    ["Seal of Eligos", "Seal of Eligos"],
    ["Seal of Amy", "Seal of Amy"],
    ["Seal of Ipos", "Seal of Ipos"],
    ["Seal of Zepar", "Seal of Zepar"],
    ["Seal of Sallos", "Seal of Sallos"],
    ["Seal of Furcas", "Seal of Furcas"],
    ["Seal of the White Horse", "Seal of the White Horse"],
    ["Seal of the Red Horse", "Seal of the Red Horse"],
    ["Seal of the Black Horse", "Seal of the Black Horse"],
    ["Seal of the Pale Horse", "Seal of the Pale Horse"],
    ["Seal of the Souls of Martyrs", "Seal of the Souls of Martyrs"],
    ["Seal of Creation Uncreated", "Seal of Creation Uncreated"],
    ["Seal of Silence in Heaven", "Seal of Silence in Heaven"],
    ["Seal of Dantre", "Seal of Dantre"],
    ["Seal of Zilon", "Seal of Zilon"],
    ["Seal of Serafeim", "Seal of Serafeim"],
    ["Seal of Pyros", "Seal of Pyros"],
    ["Seal of Padma", "Seal of Padma"],
    ["Seal of Threon", "Seal of Threon"],
    ["Seal of Petros-Pavlos", "Seal of Petros-Pavlos"],
    ["Seal of Bathin", "Seal of Bathin"],
    ["The White-Hilted Knife", "The White-Hilted Knife"],
    ["The Philosopher's Stone", "The Philosopher's Stone"],
    ["The Necklace of Harmonia", "The Necklace of Harmonia"],
    ["Dantre", "Dantre"],
    ["Seal of Botis", "Seal of Botis"]
  ];
  const match = knownSources.find(([needle]) => text.includes(needle));
  if (match) return match[1];
  return (
    text
      .replace(/\s+dealt\s+\d+.*$/i, "")
      .replace(/\s+took\s+\d+.*$/i, "")
      .replace(/\s+healed\s+.*$/i, "")
      .replace(/\s+restored\s+.*$/i, "")
      .replace(/[.!]$/g, "")
      .trim() || fallback || "Unknown"
  );
}

function mergeSourceEntries(sources) {
  const merged = new Map();
  (sources || []).forEach((entry) => {
    const amount = Math.max(0, Math.ceil(entry.amount || 0));
    if (amount <= 0) return;
    const source = entry.source || "Unknown";
    const kind = entry.kind || "";
    const key = `${kind}\u0000${source}`;
    const previous = merged.get(key) || { source, kind, amount: 0 };
    previous.amount += amount;
    merged.set(key, previous);
  });
  return Array.from(merged.values());
}

function mergeSignedSourceEntries(sources) {
  const merged = new Map();
  (sources || []).forEach((entry) => {
    const raw = Number(entry.amount || 0);
    if (!Number.isFinite(raw) || raw === 0) return;
    const amount = raw > 0 ? Math.ceil(raw) : -Math.ceil(Math.abs(raw));
    const source = entry.source || "Unknown";
    merged.set(source, (merged.get(source) || 0) + amount);
  });
  return Array.from(merged, ([source, amount]) => ({ source, amount })).filter((entry) => entry.amount !== 0);
}

function sourceTooltip(sources, kind = "damage") {
  if (kind === "signed-credits") {
    return mergeSignedSourceEntries(sources)
      .map((entry) => `${entry.amount > 0 ? "+" : "-"}${Math.abs(entry.amount)} SIN from ${entry.source}`)
      .join("\n");
  }
  if (kind === "damage") {
    const damageEntries = mergeSourceEntries((sources || []).filter((entry) => !entry.kind || entry.kind === "damage"));
    const flatBonusEntries = mergeSourceEntries((sources || []).filter((entry) => entry.kind === "flat-bonus"));
    const multiplierBonusEntries = mergeSourceEntries((sources || []).filter((entry) => entry.kind === "multiplier-bonus"));
    const bonusEntries = mergeSourceEntries((sources || []).filter((entry) => entry.kind === "bonus"));
    const savedEntries = mergeSourceEntries((sources || []).filter((entry) => entry.kind === "saved"));
    return [
      ...damageEntries.map((entry) => `-${entry.amount} health from ${entry.source}`),
      ...flatBonusEntries.map((entry) => `+${entry.amount} flat damage from ${entry.source}`),
      ...multiplierBonusEntries.map((entry) => `+${entry.amount} multiplied damage from ${entry.source}`),
      ...bonusEntries.map((entry) => `+${entry.amount} bonus damage from ${entry.source}`),
      ...savedEntries.map((entry) => `+${entry.amount} health saved from ${entry.source}`)
    ].join("\n");
  }
  const sign = kind === "damage" ? "-" : "+";
  const unit = kind === "credits" ? "SIN" : kind === "memory" ? "memory" : "health";
  return mergeSourceEntries(sources)
    .map((entry) => `${sign}${entry.amount} ${unit} from ${entry.source}`)
    .join("\n");
}

function sealIdFromStatSource(source) {
  const sourceText = String(source || "").trim();
  if (!sourceText) return "";
  return (
    PASSIVE_IDS.find((id) => {
      const name = ITEMS[id]?.name;
      return name && (sourceText === name || sourceText.startsWith(`${name} `));
    }) || ""
  );
}

function sealStatsFor(id) {
  if (!id) return null;
  state.sealStats = state.sealStats || {};
  const stats = state.sealStats[id] || {
    damage: 0,
    healing: 0,
    credits: 0,
    saved: 0,
    memory: 0,
    bounty: 0,
    bountyRemoved: 0,
    triggers: 0
  };
  state.sealStats[id] = stats;
  return stats;
}

function recordSealStat(id, kind, amount) {
  const value = Math.max(0, Math.ceil(amount));
  if (!PASSIVE_IDS.includes(id) || value <= 0) return;
  const stats = sealStatsFor(id);
  if (!stats) return;
  stats[kind] = (stats[kind] || 0) + value;
  if (kind === "damage") recordRunSealDamage(id, value);
}

function recordSealTrigger(id) {
  if (!PASSIVE_IDS.includes(id)) return;
  const stats = sealStatsFor(id);
  if (!stats) return;
  stats.triggers = (stats.triggers || 0) + 1;
}

function recordSealStatFromSource(kind, amount, source) {
  const id = sealIdFromStatSource(source);
  recordSealStat(id, kind, amount);
}

function sealContributionParts(stats, { includeTriggers = false } = {}) {
  const parts = [];
  if (!stats) return parts;
  if (stats.damage > 0) parts.push(`${stats.damage} damage dealt`);
  if (stats.healing > 0) parts.push(`${stats.healing} healing done`);
  if (stats.saved > 0) parts.push(`${stats.saved} damage negated`);
  if (stats.credits > 0) parts.push(`${stats.credits} SIN gained`);
  if (stats.memory > 0) parts.push(`${stats.memory} MEMORY added`);
  if (stats.bounty > 0) parts.push(`${stats.bounty} BOUNTY added`);
  if (stats.bountyRemoved > 0) parts.push(`${stats.bountyRemoved} BOUNTY removed`);
  if (includeTriggers && stats.triggers > 0) parts.push(`${stats.triggers} trigger${stats.triggers === 1 ? "" : "s"}`);
  return parts;
}

function sealContributionSummary(item) {
  const stats = state.sealStats?.[item?.id];
  if (!stats) return "";
  const parts = sealContributionParts(stats);
  if (!parts.length && stats.triggers > 0) parts.push(`${stats.triggers} trigger${stats.triggers === 1 ? "" : "s"}`);
  return parts.length ? `Total: ${parts.join(" / ")}` : "";
}

function sealContributionDetails(item) {
  const stats = state.sealStats?.[item?.id];
  const parts = sealContributionParts(stats, { includeTriggers: true });
  if (item?.id === "p111" && item.lastSatanDivisor && item.lastSatanMaxDivisor) {
    parts.push(`last divisor ${item.lastSatanDivisor}`);
    parts.push(`last Satan damage ${item.lastSatanDamage || 0}`);
  }
  if (!parts.length) return "This run:\nNo tracked effect yet.";
  return `This run:\n${parts.map((part) => `- ${part}`).join("\n")}`;
}

