export interface MatchScoreUserInput {
  location?: string | null;
  teachSkills?: { skillId?: string; skill?: { name?: string } | null }[] | null;
  learnSkills?: { skillId?: string; skill?: { name?: string } | null }[] | null;
  availability?: { dayOfWeek: number; startTime: string; endTime: string }[] | null;
}

function collectSkillNames(
  skills: MatchScoreUserInput["teachSkills"] | MatchScoreUserInput["learnSkills"]
): Set<string> {
  const names = new Set<string>();
  for (const s of skills || []) {
    const name = s.skill?.name ?? s.skillId ?? "";
    if (name) names.add(name.trim().toLowerCase());
  }
  return names;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function slotsOverlap(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string }
): boolean {
  return timeToMinutes(a.startTime) < timeToMinutes(b.endTime) && timeToMinutes(b.startTime) < timeToMinutes(a.endTime);
}

function availabilityOverlap(
  a: MatchScoreUserInput["availability"],
  b: MatchScoreUserInput["availability"]
): number {
  if (!a?.length || !b?.length) return 0;
  let overlap = 0;
  for (const s1 of a) {
    for (const s2 of b) {
      if (s1.dayOfWeek === s2.dayOfWeek && slotsOverlap(s1, s2)) overlap += 1;
    }
  }
  return overlap / Math.max(a.length, b.length);
}

export function computeMatchScore(userA: MatchScoreUserInput, userB: MatchScoreUserInput): number {
  const aTeach = collectSkillNames(userA.teachSkills);
  const aLearn = collectSkillNames(userA.learnSkills);
  const bTeach = collectSkillNames(userB.teachSkills);
  const bLearn = collectSkillNames(userB.learnSkills);

  const countIntersection = (a: Set<string>, b: Set<string>) => {
    let count = 0;
    for (const value of a) {
      if (b.has(value)) count += 1;
    }
    return count;
  };

  const sharedTeachToLearn = countIntersection(aTeach, bLearn);
  const sharedLearnToTeach = countIntersection(aLearn, bTeach);

  const skillScore = Math.min(0.7, (sharedTeachToLearn + sharedLearnToTeach) * 0.35);

  const availabilityBonus = availabilityOverlap(userA.availability, userB.availability) * 0.2;

  const proximityBonus =
    userA.location && userB.location && userA.location.trim().toLowerCase() === userB.location.trim().toLowerCase()
      ? 0.1
      : 0;

  return Math.min(1, Number((skillScore + availabilityBonus + proximityBonus).toFixed(2)));
}