import React from 'react';

export const joystickRef = React.createRef<any>();

export const CustomSliderRefs = {
    Z: React.createRef<any>(),
    Y: React.createRef<any>(),
    SPEED: React.createRef<any>(),
    YAW_ROTATION: React.createRef<any>(),
};

export const GLOBAL_GESTURE_REFS = [
    joystickRef,
    CustomSliderRefs.Z,
    CustomSliderRefs.Y,
    CustomSliderRefs.SPEED,
    CustomSliderRefs.YAW_ROTATION,
];
