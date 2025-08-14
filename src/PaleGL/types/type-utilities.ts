export type RequiredProperty<T,K extends keyof T> = T & {
    [P in K]-?: T[P]
}
