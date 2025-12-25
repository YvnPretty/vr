using UnityEngine;

public class ARInteractable : MonoBehaviour
{
    private Vector2 lastTouchPosition;
    private float initialDistance;
    private Vector3 initialScale;

    private void Update()
    {
        if (Input.touchCount == 1)
        {
            HandleMoveAndRotate();
        }
        else if (Input.touchCount == 2)
        {
            HandleScale();
        }
    }

    private void HandleMoveAndRotate()
    {
        Touch touch = Input.GetTouch(0);

        if (touch.phase == TouchPhase.Began)
        {
            lastTouchPosition = touch.position;
        }
        else if (touch.phase == TouchPhase.Moved)
        {
            Vector2 delta = touch.position - lastTouchPosition;
            
            // Rotation (Horizontal movement rotates around Y axis)
            transform.Rotate(Vector3.up, -delta.x * 0.5f);
            
            lastTouchPosition = touch.position;
        }
    }

    private void HandleScale()
    {
        Touch touch0 = Input.GetTouch(0);
        Touch touch1 = Input.GetTouch(1);

        if (touch0.phase == TouchPhase.Began || touch1.phase == TouchPhase.Began)
        {
            initialDistance = Vector2.Distance(touch0.position, touch1.position);
            initialScale = transform.localScale;
        }
        else if (touch0.phase == TouchPhase.Moved || touch1.phase == TouchPhase.Moved)
        {
            float currentDistance = Vector2.Distance(touch0.position, touch1.position);
            if (Mathf.Approximately(initialDistance, 0)) return;

            float factor = currentDistance / initialDistance;
            transform.localScale = initialScale * factor;
        }
    }
}
