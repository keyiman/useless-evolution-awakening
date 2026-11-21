/** Pre-generated Lux3D props. The game only loads local GLBs; it never creates tasks. */
export const TRIAL_PROPS = [
  {
    id: 'gripper', name: '抓取机械臂', height: .70, span: .92,
    prompt: 'One isolated compact industrial robotic gripper arm for a tabletop laboratory game. A short articulated elbow arm on a small heavy pedestal, a clearly recognizable large two-finger parallel gripping claw at the end. The two curved metal jaws are open with a generous empty gap between them, rubber grip pads, exposed hinge pins, actuator cylinders, readable mechanical joints. The arm extends horizontally to the LEFT, the open claw points LEFT, the pedestal is on the RIGHT. Off-white enamel, brushed steel, small muted orange safety details. Strong readable silhouette, believable connected engineering, full entire device visible. No objects held, no cup, no chair, no environment, no floor plate, no text, no lettering, no logo, no people. A single coherent isolated game-ready 3D product, realistic PBR materials, centered, plain neutral studio background.'
  },
  {
    id: 'wind-fan', name: '环境试验风机', height: .68, span: .65,
    prompt: 'One isolated compact industrial high velocity floor fan for a tabletop wind tunnel test laboratory. A large circular cylindrical turbine housing with five broad visible fan blades behind an open radial metal safety grille, a short tilting U-shaped metal stand and two sturdy rubber feet, a small motor at the rear. The round fan face and protective wire grille are clearly readable from the front. Muted sage green powder coated metal, brushed steel grille, dark rubber feet, small orange adjustment knobs. Strong clean silhouette, physically connected believable industrial design. Full entire device visible, three quarter front product view. No wind effects, no environment, no room, no text, no logo, no people, no detached pieces. One single coherent isolated game-ready realistic PBR 3D asset, centered on plain neutral studio background.'
  },
  {
    id: 'power-dock', name: '外部供能基座', height: .45, span: .55,
    prompt: 'One isolated compact portable laboratory power supply battery dock for a tabletop experiment game. A sturdy rectangular cream enamel metal body with a thick integrated black carry handle on top, two large round recessed power sockets on the front, one large orange mechanical power toggle switch, three small simple green indicator light lenses, black rubber corner protectors and stable rubber feet. A short thick black power cable with one chunky unplugged industrial connector resting beside the base, cable physically connected to the unit. The orange switch, power sockets and chunky unplugged connector must be clearly recognizable. No screen text, no letters, no numbers, no logo, no room, no environment, no people. Full entire object visible, one connected isolated game-ready realistic PBR product, centered, plain neutral studio background.'
  },
] as const;

export type TrialPropId = typeof TRIAL_PROPS[number]['id'];
