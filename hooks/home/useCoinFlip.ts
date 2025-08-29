// hooks/useCoinFlip.ts
import { useCallback, useMemo, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'

type Side = 'pile' | 'face'

export function useCoinFlip() {
    const spin = useRef(new Animated.Value(0)).current
    const spinAngleRef = useRef(0)

    const [baseAmount, setBaseAmount] = useState(100)
    const [pot, setPot] = useState(100)
    const [rounds, setRounds] = useState(0)
    const [lastPick, setLastPick] = useState<Side | null>(null)
    const [lastFlip, setLastFlip] = useState<Side | null>(null)
    const [lost, setLost] = useState(false)
    const [isFlipping, setIsFlipping] = useState(false)

    const spinMod = useMemo(() => Animated.modulo(spin, 360), [spin])

    const frontOpacity = useMemo(
        () =>
            spinMod.interpolate({
                inputRange: [0, 89, 90, 269, 270, 360],
                outputRange: [1, 1, 0, 0, 1, 1],
                extrapolate: 'clamp',
            }),
        [spinMod]
    )

    const backOpacity = useMemo(
        () =>
            spinMod.interpolate({
                inputRange: [0, 89, 90, 269, 270, 360],
                outputRange: [0, 0, 1, 1, 0, 0],
                extrapolate: 'clamp',
            }),
        [spinMod]
    )

    const rotateY = useMemo(
        () =>
            spin.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
                extrapolate: 'extend',
            }),
        [spin]
    )

    const scaleX = useMemo(
        () =>
            spinMod.interpolate({
                inputRange: [0, 90, 180, 270, 360],
                outputRange: [1, 0.8, 1, 0.8, 1],
            }),
        [spinMod]
    )

    const start = useCallback((initialAmount: number) => {
        setBaseAmount(initialAmount)
        setPot(initialAmount)
        setRounds(0)
        setLastPick(null)
        setLastFlip(null)
        setLost(false)
        spin.stopAnimation()
        spin.setValue(0)
        spinAngleRef.current = 0
    }, [spin])

    const flip = useCallback(
        (pick: Side) => {
            if (lost || isFlipping) return
            setIsFlipping(true)
            const result: Side = Math.random() < 0.5 ? 'pile' : 'face'

            const fullSpins = 3
            const desired = result === 'pile' ? 0 : 180
            const currentMod = ((spinAngleRef.current % 360) + 360) % 360
            const deltaToDesired = (desired - currentMod + 360) % 360
            const target = spinAngleRef.current + 360 * fullSpins + deltaToDesired

            Animated.timing(spin, {
                toValue: target,
                duration: 1100,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start(() => {
                spinAngleRef.current = target
                setLastPick(pick)
                setLastFlip(result)
                if (pick === result) {
                    setPot((p) => p * 2)
                    setRounds((r) => r + 1)
                } else {
                    setPot(0)
                    setLost(true)
                }
                setIsFlipping(false)
            })
        },
        [isFlipping, lost, spin]
    )

    return {
        // state
        baseAmount,
        pot,
        rounds,
        lastPick,
        lastFlip,
        lost,
        isFlipping,
        // animations
        frontOpacity,
        backOpacity,
        rotateY,
        scaleX,
        // actions
        start,
        flip,
    }
}
