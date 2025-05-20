port module Main exposing (main)

import Elm.Parser as Parser
import Elm.Syntax.Declaration as Declaration exposing (Declaration)
import Elm.Syntax.Exposing as Exposing
import Elm.Syntax.File exposing (File)
import Elm.Syntax.Module as Module
import Elm.Syntax.Node as Node
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
            let
                res =
                    case Parser.parseToFile s |> Result.map formattedDecls of
                        Err _ ->
                            "failed to parse elm file"

                        Ok file ->
                            file
            in
            ( model, toJs res )


type alias Decls =
    { funcs : List String, types : List String }


formattedDecls : File -> String
formattedDecls { declarations, moduleDefinition } =
    let
        exposeList =
            Module.exposingList <| Node.value moduleDefinition

        exposedDecls =
            declarations
                |> List.map Node.value
                |> List.foldl
                    (\decl acc ->
                        case decl of
                            -- TODO nameだけでなくfunctionの型やtypeの右辺もelm-codegenでformatする
                            Declaration.FunctionDeclaration function ->
                                function.signature
                                    |> Maybe.map (Node.value >> .name >> Node.value)
                                    |> Maybe.map
                                        (\name ->
                                            if Exposing.exposesFunction name exposeList then
                                                pushFunc name acc

                                            else
                                                acc
                                        )
                                    |> Maybe.withDefault acc

                            Declaration.AliasDeclaration typeAlias ->
                                let
                                    name =
                                        typeAlias.name |> Node.value
                                in
                                if Exposing.exposesFunction name exposeList then
                                    pushType name acc

                                else
                                    acc

                            Declaration.CustomTypeDeclaration typeDeclaration ->
                                let
                                    name =
                                        typeDeclaration.name |> Node.value
                                in
                                if Exposing.exposesFunction name exposeList then
                                    pushType name acc

                                else
                                    acc

                            _ ->
                                acc
                    )
                    { funcs = [], types = [] }
    in
    ""


pushFunc : String -> Decls -> Decls
pushFunc name { funcs, types } =
    { funcs = name :: funcs, types = types }


pushType : String -> Decls -> Decls
pushType name { funcs, types } =
    { funcs = funcs, types = name :: types }
