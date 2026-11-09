# Gameplay systems and design rules

Wanderhome is an idle game you can also inhabit. The house drives itself; the player can
nudge, build, trade, and explore, but ignoring it must never punish them.

## The loop

1. The house rolls across an endless, seeded world.
2. Edge-mounted harvesters gather resources; weapons fight critters.
3. Towns buy and sell resources and stock blueprints; landmarks grant rewards, buffs, rumours,
   and map reveals.
4. Resources buy parts, locomotion, frames, and grid expansions in the Workshop.
5. Discoveries fill the Scrapbook and unlock milestones, postcards, and permanent bonuses.
6. When ready, retire the house: earn Legacy Sparks, spend them on family perks, pick an
   inheritance, and start the next generation.

A run is a house; the family is the meta-game. The Scrapbook, postcards, milestones, perks,
and lifetime totals survive retirement.

## Controls

| Input | Action |
| --- | --- |
| Do nothing | autopilot drives, harvests, trades, and fights |
| `WASD` / arrows | drive manually (inside) or walk (outside) |
| `E` | step outside / climb back in |
| Left-click | focus the game; while inside, click the house to step outside; while outside, click the ground to walk there |
| Right-click | set a waypoint on the world; the house parks when it arrives (left-clicking the minimap also sets one) |
| Wheel | zoom |
| `T` | take or release the wheel; manual driving is 25% faster |
| `P` | park for a while / resume autopilot |
| `Space` | honk inside / swing at critters and nodes outside |
| `G` / `B` / `I` / `J` / `L` | Workshop / town journal / Supplies & plans / Memories / Family |
| `H` | hide the UI |
| `Esc` | close the open panel |

The house drives in `forage`, `wander`, or `heading` mode; a full cargo hold or a manual
waypoint can override that with a trade run or a direct target. It recovers from getting
stuck and from breakdowns on its own.

Manual waypoints park the house when it arrives, instead of immediately wandering off again.
`P` parks anywhere for a timed break, and **Park**/`P` again resumes. A park always expires on
its own, so autopilot can never be left off by accident. Opening a town's panel while
docked also parks it, giving you time to browse.

Destinations respect the current locomotion. A waypoint snaps to the nearest open ground
instead of landing in water or on a cliff, curiosities whose centre is unreachable are
skipped, and a town whose centre the current locomotion cannot cross is met at a drivable
edge gate. The house may still hug a coastline while looking for a way around, but it no
longer commits to a spot it can never stand on.

### Homeport's people (first slice)

Homeport is the first settlement with residents. Four of them have names, roles and
loose daily routines: Mira tends the bean rows, Tobin mends things at the workshop, Pip
plays on the green, and Sable keeps the watchtower. In the morning they leave their houses
at staggered times; during the day they potter around their work, take breaks at the well
or green, and sometimes make a small side trip somewhere else in town. At dusk they gather
at the well; at night most go indoors, while Sable keeps watch. Their current activity is
listed in Homeport's town panel.

The routines are seeded by the in-game day, so the next morning is not an exact repeat:
work spots, break times and the occasional side trip change. They are still lightweight
walkers rather than pathfinders, but they no longer stand in one spot like garden
ornaments: Mira works a hoe through the rows, Tobin taps at something small, Pip runs
about, and Sable paces the watchtower.

A town-watch kill outside the safe ring leaves spoils. Mira is bold enough to sprint for
them if the coast is clear; if a critter is still nearby she hesitates, and if one gets
close while she is running she abandons the idea and heads home for a while. Nobody dies
over it. This is a one-town prototype: the plan and resident code are size-neutral, but
the roster is deliberately gated to Homeport until the model has earned its keep.

**Supplies & plans (I)** can be opened anywhere, not just in town. Each resource has a
**Lock** (a floor that is never auto-sold) and a **Collect up to** limit (an upper bound
where the house stops gathering it). A **plan** is a specific known part, frame,
locomotion, or chassis expansion. While a plan is active, the house protects its materials
from auto-sell, prioritises the matching nodes, leaves cargo room for the remaining
requirements, and stops gathering once it has enough. Setting a plan lifts any collection
limit that would block it (it never lowers one). Refined materials such as metal or gears
also pull in the inputs for any installed processor that makes them.

## Systems

| System | What it does | Code |
| --- | --- | --- |
| Driving and navigation | engine power, throttle, autopilot target choice, stuck recovery, trade runs | `game/sim/driving.ts`, `navigation.ts` |
| Harvest | edge tools hit nodes; drops, magnets, and processing chains | `game/sim/harvest.ts` |
| Combat | weapons, projectiles, critters, damage, temporary breakdowns | `game/sim/weapons.ts`, `critters.ts` |
| Towns and trade | docking, prices, stock, blueprints, rumours, auto-sell | `game/sim/towns.ts` |
| Town watch | static town defenses, safe zones, no spawns near settlements | `game/sim/towns.ts` |
| Residents | Homeport's first-slice schedules, walking and town-watch spoils | `game/sim/residents.ts`, `game/world/settlement.ts` |
| Parking | timed stops, waypoint arrivals, town browsing | `game/sim/rest.ts` |
| Supplies & plans | per-resource collection limits, build goals, plan-aware sell protection and foraging | `game/sim/plan.ts` |
| Workshop | grid placement, synergies, locomotion/frames, expansion | `game/sim/workshop.ts`, `vehicleStats.ts` |
| Exploration | landmarks, buffs, rumours, map reveals | `game/sim/exploration.ts` |
| Offline | away earnings at the sampled rate | `game/sim/offline.ts` |
| Family | generations, sparks, perks, inheritance, Scrapbook, postcards, milestones, visitors, coffee, cat | `game/family/` |
| Avatar | walk inside/outside, repair, manual harvest/attack | `game/sim/avatar.ts` |

## Progression

- **Retirement** requires `RETIRE_REQ` (1,200 earned and 3 biomes discovered). It is a choice,
  not a failure; the player can keep the current house forever.
- **Legacy Sparks** come from a run's wealth/earnings, biomes, towns, landmarks, and distance,
  scaled by generation. Each Legacy upgrade has three ranks and is permanent.
- **Inheritance**: the next generation starts by picking one of three random inherited
  bonuses (coins, blueprints, installed parts, resources, a buff, a map reveal, …).
- **Scrapbook** entries are generated from content lists, so new biomes, critters, landmarks,
  and parts appear automatically. Milestones are checked against run/lifetime stats.
- **Visitors** are optional, self-resolving events. Every outcome is positive or neutral; a
  trader who is ignored leaves a small gift, a cat may simply move in.

## Design rules

- **No hard fail state.** The house can break down, lose cargo, and limp home, but it always
  recovers. There is no game over.
- **Every system survives being ignored.** Autopilot, offline earnings, visitors, milestones,
  trade runs, and crew all resolve themselves. A player who closes the tab for a day should
  come back to progress, not a penalty.
- **No daily streaks or FOMO.** The morning coffee is a once-a-day gift (local date), not a
  chore, and missing it costs nothing permanent.
- **Towns are a breather.** The watch shoots nearby critters using gear derived from local
  goods and the town's stock. No critters spawn inside the watch radius, and a parked or
  docked house inside it is not attacked. Town kills drop loot normally; no special cases.
- **Stops are temporary.** Parking always has a countdown and auto-resumes, so the idle
  game cannot be accidentally left switched off.
- **Cozy, specific, gently funny.** Text is warm and observational, never cynical or
  punishing. Keep the house, the family, and the small domestic details in focus.
- **The idle game and the immersive game are separate.** This is the one you leave running;
  *The Last Messenger* is the one you sit down for. Don't add twitch mechanics or fail states
  that demand attention.
- **Numbers go up without runaway pressure.** Costs scale, but the game should stay readable
  and generous; prestige is an invitation, not a treadmill.
- **The world is content-driven.** New biomes, critters, landmarks, parts, and milestones
  should be data entries, not engine branches. See
  [src/content/MODDING.md](../src/content/MODDING.md).

## Writing and tone

- Flavor lives in `src/content/flavor.ts` (Scrapbook lines, postcards, cat names, crew,
  letters, welcome-back lines) and in the `desc`/`lines` fields of content definitions.
- Prefer concrete, sensory detail over generic fantasy: a chipped kettle, a cat on the step,
  rain on a tin roof.
- Emoji are part of the UI language (resources, log lines, buttons). Use them consistently
  with existing content rather than inventing a parallel icon set.
- Keep the player's time respected: short log lines, no unskippable sequences, and no
  punishment for being away.
