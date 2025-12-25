using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;

public class ARPremiumUI : MonoBehaviour
{
    [Header("Panels")]
    public GameObject mainPanel;
    public GameObject sharingPanel;
    public CanvasGroup overlayAlpha;

    [Header("Buttons")]
    public Button startSharingBtn;
    public Button stopSharingBtn;
    public Button placeObjectBtn;

    [Header("Status")]
    public TextMeshProUGUI statusText;
    public Image connectionPulse;

    [Header("References")]
    public ARViewSharer sharer;
    public ARPlacementManager placement;

    private void Start()
    {
        // Initial State
        sharingPanel.SetActive(false);
        overlayAlpha.alpha = 0;
        StartCoroutine(FadeInUI());

        startSharingBtn.onClick.AddListener(StartSharing);
        stopSharingBtn.onClick.AddListener(StopSharing);
        
        statusText.text = "SISTEMA AR LISTO";
    }

    private IEnumerator FadeInUI()
    {
        while (overlayAlpha.alpha < 1)
        {
            overlayAlpha.alpha += Time.deltaTime * 2f;
            yield return null;
        }
    }

    private void StartSharing()
    {
        sharer.ToggleSharing();
        mainPanel.SetActive(false);
        sharingPanel.SetActive(true);
        statusText.text = "TRANSMITIENDO EN VIVO";
        StartCoroutine(PulseEffect());
    }

    private void StopSharing()
    {
        sharer.ToggleSharing();
        mainPanel.SetActive(true);
        sharingPanel.SetActive(false);
        statusText.text = "SISTEMA AR LISTO";
        StopAllCoroutines();
        connectionPulse.gameObject.SetActive(false);
    }

    private IEnumerator PulseEffect()
    {
        connectionPulse.gameObject.SetActive(true);
        while (true)
        {
            float scale = 1f + Mathf.PingPong(Time.time * 2f, 0.2f);
            connectionPulse.transform.localScale = new Vector3(scale, scale, 1);
            yield return null;
        }
    }
}
