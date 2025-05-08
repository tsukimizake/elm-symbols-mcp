module Basics.Extra exposing (compareBool, compareBy, compareByHelp, flip, flipCompare, putIn, updateIn, updateMaybeIn, withEqCompare)

{-| 参考<https://package.elm-lang.org/packages/elm-community/basics-extra/latest/Basics.Extra>
他にも使いたい関数があるならこちらを使うのもあり。
-}


{-| Flip the order of the first two arguments to a function.
-}
flip : (a -> b -> c) -> (b -> a -> c)
flip f b a =
    f a b


{-| Alias to flip.
setemが生成したsetterを使って逆向きにsetしたいときに使う

    shared
        |> s_adminUser (Just adminUser)
        |> putIn s_shared m

-}
putIn : (a -> r -> r) -> r -> a -> r
putIn s r a =
    s a r


compareBy : (a -> comparable) -> a -> a -> Order
compareBy transform one two =
    compare (transform one) (transform two)


compareByHelp : (b -> b -> Order) -> (a -> b) -> a -> a -> Order
compareByHelp c transform one two =
    c (transform one) (transform two)


flipCompare : (a -> a -> Order) -> a -> a -> Order
flipCompare =
    flip


withEqCompare : (a -> a -> Order) -> (a -> a -> Order) -> a -> a -> Order
withEqCompare forEq comparer one two =
    case comparer one two of
        EQ ->
            forEq one two

        notEq ->
            notEq


compareBool : Bool -> Bool -> Order
compareBool a b =
    case ( a, b ) of
        ( True, False ) ->
            GT

        ( False, True ) ->
            LT

        _ ->
            EQ


updateIn : (a -> b) -> (b -> a -> a) -> (b -> b) -> a -> a
updateIn getter setter modifier a =
    getter a |> modifier |> putIn setter a


updateMaybeIn : (a -> Maybe b) -> (b -> a -> a) -> (b -> b) -> a -> a
updateMaybeIn getter setter modifier a =
    getter a |> Maybe.map (modifier >> putIn setter a) |> Maybe.withDefault a
