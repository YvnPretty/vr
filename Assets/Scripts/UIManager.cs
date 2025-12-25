using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class UIManager : MonoBehaviour
{
    [SerializeField] private ARViewSharer viewSharer;
    [SerializeField] private Button shareButton;
    [SerializeField] private TextMeshProUGUI statusText;

    private void Start()
    {
        shareButton.onClick.AddListener(OnShareButtonClicked);
        UpdateUI();
    }

    private void OnShareButtonClicked()
    {
        viewSharer.ToggleSharing();
        UpdateUI();
    }

    private void UpdateUI()
    {
        if (viewSharer.isSharing)
        {
            statusText.text = "Status: Sharing View...";
            shareButton.GetComponentImage().color = Color.red;
        }
        else
        {
            statusText.text = "Status: Idle";
            shareButton.GetComponentImage().color = Color.white;
        }
    }
}

// Extension to make it cleaner in the script
public static class ButtonExtensions
{
    public static Image GetComponentImage(this Button button)
    {
        return button.GetComponent<Image>();
    }
}
