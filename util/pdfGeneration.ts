
import { Alert } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { DialysisSession } from "../types";
import * as FileSystem from "expo-file-system/legacy";
import { getFormattedTime } from "./date";

export   const generateAndSharePDF = async (sessions:DialysisSession[],type) => {

    if(sessions.length==0)
    {
      Alert.alert("Error","No sessions to share!")
      return;
    }
    try {

      let htmlContent = `
        <h1 style="text-align:center;">${type} Dialysis Sessions</h1>
        <table border="1" cellspacing="0" cellpadding="8" width="100%">
          <tr>
            <th>Session No.</th>
            <th>Date</th>
            <th>Time</th>
            <th>Weight Change</th>
            <th>Water Removed</th>
            <th>Blood Pressure Change</th>
            <th>Notes</th>
          </tr>
          ${sessions?.map(
              (s:DialysisSession) => `
            <tr>
              <td>${s.id}</td>
              <td>${s.date}</td>
              <td>${ getFormattedTime(s.startTime ) } -${ getFormattedTime(s.endTime)} </td>
              <td>${s.weightBefore}kg--${s.weightAfter}kg</td>
              <td>${(Number(s.weightBefore) -  Number(s.weightAfter)).toFixed(1) }kg</td>
              <td>${s.preDialysisBP.systolic}/${s.preDialysisBP.diastolic}--${s.postDialysisBP.systolic}/${s.postDialysisBP.diastolic}</td>
              <td>${s.notes || "N/A"}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      const newUri = FileSystem.documentDirectory + `${type}_Dialysis_Sessions.pdf`;
      await FileSystem.moveAsync({ from: uri, to: newUri });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Recent Sessions PDF",
        });
      } else {
        alert("Sharing not available on this device");
      }
    } catch (err) {
      console.error("PDF generation error:", err);
    }
  };