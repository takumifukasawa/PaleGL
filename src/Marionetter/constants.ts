//
// constants
//

// --------------------------------------------------------------------
// jsonのproperty名と紐づけ
// TODO: 短縮系を渡すようにしたい
// --------------------------------------------------------------------


import {NeedsShorten} from "@/Marionetter/types";


export const PROPERTY_LOCAL_POSITION_X = NeedsShorten
    ? 'lp.x'
    : 'm_LocalPosition.x' as const;
export type PROPERTY_LOCAL_POSITION_X = typeof PROPERTY_LOCAL_POSITION_X;

export const PROPERTY_LOCAL_POSITION_Y = NeedsShorten
    ? 'lp.y'
    : 'm_LocalPosition.y' as const;
export type PROPERTY_LOCAL_POSITION_Y = typeof PROPERTY_LOCAL_POSITION_Y;

export const PROPERTY_LOCAL_POSITION_Z = NeedsShorten
    ? 'lp.z'
    : 'm_LocalPosition.z' as const;
export type PROPERTY_LOCAL_POSITION_Z = typeof PROPERTY_LOCAL_POSITION_Z;

export const PROPERTY_LOCAL_EULER_ANGLES_RAW_X = NeedsShorten
    ? 'lr.x'
    : 'localEulerAnglesRaw.x' as const;
export type PROPERTY_LOCAL_EULER_ANGLES_RAW_X = typeof PROPERTY_LOCAL_EULER_ANGLES_RAW_X;

export const PROPERTY_LOCAL_EULER_ANGLES_RAW_Y = NeedsShorten
    ? 'lr.y'
    : 'localEulerAnglesRaw.y' as const;
export type PROPERTY_LOCAL_EULER_ANGLES_RAW_Y = typeof PROPERTY_LOCAL_EULER_ANGLES_RAW_Y;

export const PROPERTY_LOCAL_EULER_ANGLES_RAW_Z = NeedsShorten
    ? 'lr.z'
    : 'localEulerAnglesRaw.z' as const;
export type PROPERTY_LOCAL_EULER_ANGLES_RAW_Z = typeof PROPERTY_LOCAL_EULER_ANGLES_RAW_Z;

export const PROPERTY_LOCAL_SCALE_X = NeedsShorten
    ? 'ls.x'
    : 'm_LocalScale.x' as const;
export type PROPERTY_LOCAL_SCALE_X = typeof PROPERTY_LOCAL_SCALE_X;

export const PROPERTY_LOCAL_SCALE_Y = NeedsShorten
    ? 'ls.y'
    : 'm_LocalScale.y' as const;
export type PROPERTY_LOCAL_SCALE_Y = typeof PROPERTY_LOCAL_SCALE_Y;

export const PROPERTY_LOCAL_SCALE_Z = NeedsShorten
    ? 'ls.z'
    : 'm_LocalScale.z' as const;
export type PROPERTY_LOCAL_SCALE_Z = typeof PROPERTY_LOCAL_SCALE_Z;

export const PROPERTY_COLOR_R = NeedsShorten
    ? 'c.r'
    : 'color.r' as const;
export type PROPERTY_COLOR_R = typeof PROPERTY_COLOR_R;

export const PROPERTY_COLOR_G = NeedsShorten
    ? 'c.g'
    : 'color.g' as const;
export type PROPERTY_COLOR_G = typeof PROPERTY_COLOR_G;

export const PROPERTY_COLOR_B = NeedsShorten
    ? 'c.b'
    : 'color.b' as const;
export type PROPERTY_COLOR_B = typeof PROPERTY_COLOR_B;

export const PROPERTY_COLOR_A = NeedsShorten
    ? 'c.a'
    : 'color.a' as const;
export type PROPERTY_COLOR_A = typeof PROPERTY_COLOR_A;

export const PROPERTY_FIELD_OF_VIEW = NeedsShorten
    ? 'fov'
    : 'field of view' as const;
export type PROPERTY_FIELD_OF_VIEW = typeof PROPERTY_FIELD_OF_VIEW;

export const PROPERTY_MATERIAL_BASE_COLOR_R = NeedsShorten
    ? 'm.bc.r'
    : 'material._BaseColor.r' as const;
export type PROPERTY_MATERIAL_BASE_COLOR_R = typeof PROPERTY_MATERIAL_BASE_COLOR_R;

export const PROPERTY_MATERIAL_BASE_COLOR_G = NeedsShorten
    ? 'm.bc.g'
    : 'material._BaseColor.g' as const;
export type PROPERTY_MATERIAL_BASE_COLOR_G = typeof PROPERTY_MATERIAL_BASE_COLOR_G;

export const PROPERTY_MATERIAL_BASE_COLOR_B = NeedsShorten
    ? 'm.bc.b'
    : 'material._BaseColor.b' as const;
export type PROPERTY_MATERIAL_BASE_COLOR_B = typeof PROPERTY_MATERIAL_BASE_COLOR_B;

export const PROPERTY_MATERIAL_BASE_COLOR_A = NeedsShorten
    ? 'm.bc.a'
    : 'material._BaseColor.a' as const;
export type PROPERTY_MATERIAL_BASE_COLOR_A = typeof PROPERTY_MATERIAL_BASE_COLOR_A;

export const PROPERTY_LIGHT_BOUNCE_INTENSITY = NeedsShorten
    ? 'bi'
    : 'bounceIntensity' as const;
export type PROPERTY_LIGHT_BOUNCE_INTENSITY = typeof PROPERTY_LIGHT_INTENSITY;

export const PROPERTY_LIGHT_INTENSITY = NeedsShorten
    ? 'i'
    : 'intensity' as const;
export type PROPERTY_LIGHT_INTENSITY = typeof PROPERTY_LIGHT_INTENSITY;

export const PROPERTY_SPOTLIGHT_RANGE = NeedsShorten
    ? 'r'
    : 'range' as const;
export type PROPERTY_SPOTLIGHT_RANGE = typeof PROPERTY_SPOTLIGHT_RANGE;


/*
export const PROPERTY_COLOR_B = 'color.b';
export const PROPERTY_COLOR_A = 'color.a';
export const PROPERTY_LIGHT_INTENSITY = 'intensity';
// const PROPERTY_BOUNCE_INTENSITY = 'bounceIntensity';
export const PROPERTY_SPOTLIGHT_RANGE = 'range';

export const PROPERTY_LOCAL_POSITION_X = 'm_LocalPosition.x';
export const PROPERTY_LOCAL_POSITION_Y = 'm_LocalPosition.y';
export const PROPERTY_LOCAL_POSITION_Z = 'm_LocalPosition.z';
export const PROPERTY_LOCAL_EULER_ANGLES_RAW_X = 'localEulerAnglesRaw.x';
export const PROPERTY_LOCAL_EULER_ANGLES_RAW_Y = 'localEulerAnglesRaw.y';
export const PROPERTY_LOCAL_EULER_ANGLES_RAW_Z = 'localEulerAnglesRaw.z';
export const PROPERTY_LOCAL_SCALE_X = 'm_LocalScale.x';
export const PROPERTY_LOCAL_SCALE_Y = 'm_LocalScale.y';
export const PROPERTY_LOCAL_SCALE_Z = 'm_LocalScale.z';
export const PROPERTY_FIELD_OF_VIEW = 'field of view';

export const PROPERTY_MATERIAL_BASE_COLOR_R = 'material._BaseColor.r';
export const PROPERTY_MATERIAL_BASE_COLOR_G = 'material._BaseColor.g';
export const PROPERTY_MATERIAL_BASE_COLOR_B = 'material._BaseColor.b';
export const PROPERTY_MATERIAL_BASE_COLOR_A = 'material._BaseColor.a';
*/
