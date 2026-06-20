import { StyleSheet, Text, View } from "react-native"
import GlobalColors from "../constants/Colors";

function Info({ info }: { info: string }) {
    return (
      <View style={styles.infoContainer}>
        <Text style={styles.infoText} >
              {info}
        </Text>
      </View>
    )
}

export default Info;


const styles=StyleSheet.create({

    infoContainer:{
        flex:1,
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:GlobalColors.primary300,
    
    },
    infoText:{
        color:GlobalColors.primary600,
        fontWeight:"700"
    }

})
