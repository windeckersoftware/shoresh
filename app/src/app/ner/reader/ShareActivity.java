package app.ner.reader;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

/**
 * Receives shared text, links and files and Process Text selections, and hands
 * them to the one running MainActivity. Without it, a share from another app
 * starts a second MainActivity inside that app's task, and two copies of the
 * app each save their own state.json.
 */
public class ShareActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Intent in = getIntent();
        if (in != null && savedInstanceState == null) {
            Intent out = new Intent(in);
            out.setComponent(null);
            out.setClass(this, MainActivity.class);
            out.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            try { startActivity(out); } catch (Exception ignored) { }
        }
        finish();
    }
}
