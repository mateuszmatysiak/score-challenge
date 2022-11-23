type GetStageName = {
  groupName?: string;
  playoffName?: string;
};

export const getStageName = ({ groupName, playoffName }: GetStageName) => {
  if (groupName) return `Group ${groupName}`;

  if (playoffName) return playoffName;

  return "Stage Name";
};
