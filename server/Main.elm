port module Main exposing (Model, Msg, main)

import Elm.Parser as Parser
import Elm.Syntax.Declaration as Declaration
import Elm.Syntax.Exposing as Exposing
import Elm.Syntax.File exposing (File)
import Elm.Syntax.Module as Module
import Elm.Syntax.Node as Node
import Elm.Syntax.Signature as Signature
import Elm.Syntax.Type as Type
import Elm.Syntax.TypeAlias as TypeAlias
import Elm.Syntax.TypeAnnotation as TypeAnnotation
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


formatTypeAnnotation : TypeAnnotation.TypeAnnotation -> String
formatTypeAnnotation typeAnnotation =
    case typeAnnotation of
        TypeAnnotation.GenericType name ->
            name

        TypeAnnotation.Typed (Node.Node _ ( moduleName, name )) args ->
            let
                modulePart =
                    if List.isEmpty moduleName then
                        ""

                    else
                        String.join "." moduleName ++ "."

                argsPart =
                    if List.isEmpty args then
                        ""

                    else
                        " " ++ String.join " " (List.map (Node.value >> formatTypeAnnotation) args)
            in
            modulePart ++ name ++ argsPart

        TypeAnnotation.Unit ->
            "()"

        TypeAnnotation.Tupled items ->
            "(" ++ String.join ", " (List.map (Node.value >> formatTypeAnnotation) items) ++ ")"

        TypeAnnotation.Record fields ->
            "{ " ++ String.join ", " (List.map formatRecordField fields) ++ " }"

        TypeAnnotation.GenericRecord (Node.Node _ name) (Node.Node _ fields) ->
            "{ " ++ name ++ " | " ++ String.join ", " (List.map formatRecordField fields) ++ " }"

        TypeAnnotation.FunctionTypeAnnotation (Node.Node _ left) (Node.Node _ right) ->
            formatTypeAnnotation left ++ " -> " ++ formatTypeAnnotation right


formatRecordField : Node.Node ( Node.Node String, Node.Node TypeAnnotation.TypeAnnotation ) -> String
formatRecordField (Node.Node _ ( Node.Node _ name, Node.Node _ typeAnnotation )) =
    name ++ " : " ++ formatTypeAnnotation typeAnnotation


formatFunctionSignature : Signature.Signature -> String
formatFunctionSignature { name, typeAnnotation } =
    Node.value name ++ " : " ++ formatTypeAnnotation (Node.value typeAnnotation)


isExposedItem : String -> Node.Node Exposing.TopLevelExpose -> Bool
isExposedItem targetName (Node.Node _ expose) =
    case expose of
        Exposing.InfixExpose _ ->
            False

        Exposing.FunctionExpose exposedName ->
            exposedName == targetName

        Exposing.TypeOrAliasExpose exposedName ->
            exposedName == targetName

        Exposing.TypeExpose { name } ->
            name == targetName


formatTypeAlias : TypeAlias.TypeAlias -> String
formatTypeAlias { name, typeAnnotation } =
    "type alias " ++ Node.value name ++ " = " ++ formatTypeAnnotation (Node.value typeAnnotation)


formatCustomType : Type.Type -> String
formatCustomType { name, constructors } =
    let
        constructorStrings =
            List.map formatConstructor constructors
                |> String.join " | "
    in
    "type " ++ Node.value name ++ " = " ++ constructorStrings


formatConstructor : Node.Node Type.ValueConstructor -> String
formatConstructor (Node.Node _ { name, arguments }) =
    let
        argsString =
            if List.isEmpty arguments then
                ""

            else
                " " ++ String.join " " (List.map (Node.value >> formatTypeAnnotation) arguments)
    in
    Node.value name ++ argsString


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
                            Declaration.FunctionDeclaration function ->
                                function.signature
                                    |> Maybe.map Node.value
                                    |> Maybe.map
                                        (\signature ->
                                            let
                                                name =
                                                    Node.value signature.name
                                            in
                                            if Exposing.exposesFunction name exposeList then
                                                pushFunc (formatFunctionSignature signature) acc

                                            else
                                                acc
                                        )
                                    |> Maybe.withDefault acc

                            Declaration.AliasDeclaration typeAlias ->
                                let
                                    name =
                                        typeAlias.name |> Node.value
                                in
                                case exposeList of
                                    Exposing.All _ ->
                                        pushType (formatTypeAlias typeAlias) acc

                                    Exposing.Explicit items ->
                                        if List.any (isExposedItem name) items then
                                            pushType (formatTypeAlias typeAlias) acc

                                        else
                                            acc

                            Declaration.CustomTypeDeclaration typeDeclaration ->
                                let
                                    name =
                                        typeDeclaration.name |> Node.value
                                in
                                case exposeList of
                                    Exposing.All _ ->
                                        pushType (formatCustomType typeDeclaration) acc

                                    Exposing.Explicit items ->
                                        if List.any (isExposedItem name) items then
                                            pushType (formatCustomType typeDeclaration) acc

                                        else
                                            acc

                            _ ->
                                acc
                    )
                    { funcs = [], types = [] }
    in
    exposedDecls
        |> (\{ funcs, types } ->
                "symbols\n"
                    ++ String.join "\n" funcs
                    ++ "\n\ntype decls\n"
                    ++ String.join "\n" types
           )


pushFunc : String -> Decls -> Decls
pushFunc name { funcs, types } =
    { funcs = name :: funcs, types = types }


pushType : String -> Decls -> Decls
pushType name { funcs, types } =
    { funcs = funcs, types = name :: types }
