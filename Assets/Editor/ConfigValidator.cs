using UnityEditor;
using UnityEngine;
using UnityEngine.XR.ARFoundation;

public class ConfigValidator : EditorWindow
{
    [MenuItem("Window/AR Game/Validate Config")]
    public static void ShowWindow()
    {
        GetWindow<ConfigValidator>("Config Validator");
    }

    private void OnGUI()
    {
        GUILayout.Label("AR Project Configuration Status", EditorStyles.boldLabel);

        if (GUILayout.Button("Check Player Settings"))
        {
            CheckSettings();
        }
    }

    private void CheckSettings()
    {
        Debug.Log("--- AR Config Check ---");
        Debug.Log("Min Android API: " + PlayerSettings.Android.minSdkVersion);
        Debug.Log("iOS Camera Usage: " + PlayerSettings.iOS.cameraUsageDescription);
        
        var graphics = PlayerSettings.GetGraphicsAPIs(BuildTarget.Android);
        foreach (var api in graphics)
        {
            Debug.Log("Android Graphics API: " + api);
        }
        Debug.Log("-----------------------");
    }
}
