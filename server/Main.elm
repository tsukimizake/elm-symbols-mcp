port module Main exposing (main)

import Platform


port fromJs : (String -> msg) -> Sub msg


port toJs : String -> Cmd msg


type alias Model =
    ()


type Msg
    = GotElmFile String


main : Program () Model Msg
main =
    Platform.worker
        { init = \_ -> ( (), Cmd.none )
        , update = update
        , subscriptions = \_ -> fromJs GotElmFile
        }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        GotElmFile s ->
            -- TODO
            ( model, toJs s )
